import chalk from 'chalk';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateConfig } from './config.js';
import { buildHealthOverview } from './health-overview.js';
import { runHealthCheck } from './health-check.js';

const PROD_URL =
  process.env.VERCEL_URL && process.env.VERCEL === '1'
    ? `https://${process.env.VERCEL_URL}`
    : 'https://marketing-automations-kohl.vercel.app';

async function fetchCronHistoryFromEnv() {
  const REDIS_URL =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const REDIS_TOKEN =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!REDIS_URL || !REDIS_TOKEN) {
    return { configured: false, entries: [], note: 'Geen UPSTASH_REDIS_* / KV_* in .env' };
  }
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
    const keys = (await redis.keys('cron:*')).sort().reverse().slice(0, 14);
    const entries = [];
    for (const key of keys) {
      const dateStr = key.replace('cron:', '');
      const raw = await redis.lrange(key, 0, -1);
      const runs = raw
        .map((r) => {
          try {
            return typeof r === 'string' ? JSON.parse(r) : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      if (runs.length === 0) continue;
      const last = runs[runs.length - 1];
      entries.push({
        date: dateStr,
        syncs: runs.length,
        appointments: last?.appointments ?? 0,
        updated: runs.reduce((s, r) => s + (r.updated ?? 0), 0),
        errors: runs.reduce((s, r) => s + (r.errors ?? 0), 0),
        elapsed: last?.elapsed ?? '-',
        lastTime: last?.time ?? '-',
      });
    }
    entries.sort((a, b) => (b.date > a.date ? 1 : -1));
    return { configured: true, entries };
  } catch (e) {
    return {
      configured: true,
      entries: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function runVercelLogSample({ since = '3d', limit = 40 } = {}) {
  const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const cmd = [
    'npx',
    'vercel@latest',
    'logs',
    '--environment',
    'production',
    '--no-branch',
    '--since',
    since,
    '--no-follow',
    '-n',
    String(limit),
    '-j',
  ].join(' ');
  const r = spawnSync(cmd, {
    cwd,
    encoding: 'utf8',
    shell: true,
    timeout: 120000,
  });
  if (r.error) {
    return {
      ok: false,
      error: r.error.message,
      stderr: r.stderr || '',
    };
  }
  const lines = (r.stdout || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const cronHits = [];
  const errors = [];
  for (const line of lines) {
    try {
      const o = JSON.parse(line);
      const path = o.requestPath || '';
      if (path.includes('cron-sync')) {
        cronHits.push({
          path,
          status: o.responseStatusCode,
          ts: o.timestamp,
        });
      }
      if (o.level === 'error' && o.message && !o.message.includes('DeprecationWarning')) {
        errors.push(o.message.slice(0, 120));
      }
    } catch {
      /* ignore */
    }
  }
  return {
    ok: r.status === 0 || lines.length > 0,
    exitCode: r.status,
    stderr: (r.stderr || '').slice(0, 500),
    cronRequestsInSample: cronHits.length,
    cronSample: cronHits.slice(0, 15),
    errorLinesInSample: errors.slice(0, 5),
    lineCount: lines.length,
  };
}

export async function runAudit(options = {}) {
  const json = Boolean(options.json);
  const withVercel = Boolean(options.vercel);

  const [health, overview, redisHistory] = await Promise.all([
    runHealthCheck(),
    buildHealthOverview(),
    fetchCronHistoryFromEnv(),
  ]);

  let vercelSample = null;
  if (withVercel) {
    vercelSample = runVercelLogSample({ since: options.since || '3d', limit: Number(options.vercelLimit) || 80 });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    prodUrl: PROD_URL,
    healthCheck: health,
    overview: {
      mailchimp: overview.mailchimp,
      latestSyncPath: overview.latestSync?.reportPath ?? null,
      latestSyncTotals: overview.latestSync?.totals ?? null,
      latestSyncDate: overview.latestSync?.date ?? null,
      templatesTotal: overview.templates?.total,
      recentEmailsLast7Days: overview.recentEmailsLast7Days?.length ?? 0,
      recentEmailsError: overview.recentEmailsError,
      campaignsSentCount: overview.campaigns?.sent?.length ?? 0,
    },
    redisCronHistory: redisHistory,
    vercelLogs: vercelSample,
  };

  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return payload;
  }

  console.log('');
  console.log(chalk.bold('Cocon — volledige audit (CLI)'));
  console.log(chalk.gray(payload.generatedAt));
  console.log('');

  console.log(chalk.bold('1) Health check'));
  for (const c of health.checks) {
    const icon = c.ok ? chalk.green('✓') : chalk.red('✗');
    console.log(`   ${icon} ${c.name}: ${c.detail}`);
  }
  if (health.recentEmails?.length) {
    console.log(chalk.gray('   Recente campagnes (7d):'));
    for (const e of health.recentEmails) {
      console.log(chalk.gray(`     · ${e.subject} | ${e.count} | ${e.sent}`));
    }
  } else {
    console.log(chalk.gray('   Geen verzonden campagnes in Mailchimp (API, 7d).'));
  }

  console.log('');
  console.log(chalk.bold('2) Overview (_mailchimp + sync-bestand_)'));
  console.log(
    `   Mailchimp: ${overview.mailchimp?.healthy ? chalk.green('OK') : chalk.red('FAIL')} (${overview.mailchimp?.message || '-'})`
  );
  if (overview.latestSync) {
    const t = overview.latestSync.totals || {};
    console.log(
      `   Laatste sync (lokaal rapport): ${overview.latestSync.date || '?'} — updated ${t.updated ?? 0}, errors ${t.errors ?? 0}`
    );
  } else {
    console.log(
      chalk.yellow(
        '   Geen sync-JSON op schijf (zet SYNC_REPORT_PATH of draai sync-salonized-daily met --report).'
      )
    );
  }
  console.log(`   Templates in Mailchimp: ${overview.templates?.total ?? '?'}`);
  console.log(`   Verzonden campagnes (7d, API): ${overview.recentEmailsLast7Days?.length ?? 0}`);

  console.log('');
  console.log(chalk.bold('3) Redis cron-geschiedenis (optioneel)'));
  if (!redisHistory.configured) {
    console.log(chalk.gray(`   ${redisHistory.note || 'Niet geconfigureerd'}`));
  } else if (redisHistory.error) {
    console.log(chalk.red(`   Fout: ${redisHistory.error}`));
  } else if (!redisHistory.entries?.length) {
    console.log(chalk.yellow('   Geen cron:* keys (of leeg).'));
  } else {
    for (const row of redisHistory.entries.slice(0, 10)) {
      console.log(
        chalk.white(
          `   ${row.date}  runs:${row.syncs}  appts:${row.appointments}  updated:${row.updated}  err:${row.errors}  ${row.elapsed}`
        )
      );
    }
  }

  console.log('');
  console.log(chalk.bold('4) Config (.env)'));
  const v = validateConfig();
  console.log(`   Mailchimp config: ${v.valid ? chalk.green('geldig') : chalk.red(v.errors.join('; '))}`);
  console.log(`   SALONIZED_ICAL_URL: ${process.env.SALONIZED_ICAL_URL ? chalk.green('gezet') : chalk.red('ontbreekt')}`);
  console.log(`   CRON_SECRET: ${process.env.CRON_SECRET ? chalk.green('gezet') : chalk.yellow('leeg lokaal — op Vercel verplicht voor cron')}`);
  console.log(`   Redis: ${redisHistory.configured && !redisHistory.error ? chalk.green('bereikbaar') : chalk.gray('niet gebruikt of niet gezet')}`);

  console.log('');
  console.log(chalk.bold('5) Vercel'));
  console.log(`   Productie-URL: ${PROD_URL}`);
  if (!withVercel) {
    console.log(chalk.gray('   (Voeg --vercel toe voor log-steekproef: npx vercel logs production)'));
  } else if (vercelSample?.error) {
    console.log(chalk.red(`   Vercel CLI: ${vercelSample.error}`));
  } else {
    console.log(
      `   Steekproef regels: ${vercelSample?.lineCount ?? 0}, cron-sync treffers: ${chalk.cyan(String(vercelSample?.cronRequestsInSample ?? 0))}`
    );
    if (vercelSample?.cronSample?.length) {
      for (const h of vercelSample.cronSample) {
        console.log(chalk.gray(`     · ${JSON.stringify(h)}`));
      }
    }
    if (vercelSample?.stderr && vercelSample.exitCode !== 0) {
      console.log(chalk.yellow(vercelSample.stderr.slice(0, 200)));
    }
  }

  console.log('');
  console.log(
    health.ok && v.valid
      ? chalk.green('Audit afgerond (zie waarschuwingen hierboven).')
      : chalk.red('Audit afgerond met problemen.')
  );
  console.log('');

  return payload;
}
