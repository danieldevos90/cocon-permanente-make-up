import fs from 'fs';
import path from 'path';
import { initMailchimp } from './mailchimp-client.js';
import { config, validateConfig } from './config.js';

function parseArgs(argv) {
  const args = {
    fullMembers: false,
    output: null,
    maxTags: 30,
    maxStores: 20,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--full-members') {
      args.fullMembers = true;
    } else if (value === '--output' && argv[i + 1]) {
      args.output = argv[i + 1];
      i += 1;
    } else if (value === '--max-tags' && argv[i + 1]) {
      args.maxTags = Number.parseInt(argv[i + 1], 10) || args.maxTags;
      i += 1;
    }
  }

  return args;
}

function sortObjectEntriesDesc(input) {
  return Object.entries(input)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

async function fetchAudienceOverview(client, listId) {
  const [listInfo, mergeFieldsResponse, segmentsResponse] = await Promise.all([
    client.lists.getList(listId),
    client.lists.getListMergeFields(listId, { count: 200 }),
    client.lists.listSegments(listId, { count: 1000 }),
  ]);

  const mergeFields = (mergeFieldsResponse.merge_fields || []).map(field => ({
    tag: field.tag,
    name: field.name,
    type: field.type,
    required: field.required,
    public: field.public,
  }));

  const segments = (segmentsResponse.segments || []).map(segment => ({
    id: segment.id,
    name: segment.name,
    type: segment.type,
    memberCount: segment.member_count,
  }));

  return {
    list: {
      id: listInfo.id,
      name: listInfo.name,
      stats: listInfo.stats,
      permissionReminder: listInfo.permission_reminder || null,
      campaignDefaults: listInfo.campaign_defaults || null,
    },
    mergeFields,
    segments,
  };
}

async function fetchMemberSignals(client, listId, fullMembers) {
  const sourceCounts = {};
  const tagCounts = {};
  const statusCounts = {};
  const sourceSamples = {};
  const pageSize = 1000;
  const limit = fullMembers ? Number.POSITIVE_INFINITY : 1000;
  let offset = 0;
  let totalItems = null;

  while (offset < limit) {
    const count = Number.isFinite(limit) ? Math.min(pageSize, limit - offset) : pageSize;
    if (count <= 0) break;

    const response = await client.lists.getListMembersInfo(listId, { count, offset });
    totalItems = response.total_items;
    const members = response.members || [];

    if (members.length === 0) {
      break;
    }

    for (const member of members) {
      const source = member.source || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;

      const status = member.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (!sourceSamples[source]) sourceSamples[source] = [];
      if (sourceSamples[source].length < 3) {
        sourceSamples[source].push({
          email: member.email_address,
          lastChanged: member.last_changed || null,
          tags: (member.tags || []).map(tag => tag.name),
        });
      }

      for (const tag of member.tags || []) {
        const name = tag.name || 'unknown';
        tagCounts[name] = (tagCounts[name] || 0) + 1;
      }
    }

    offset += members.length;
    if (members.length < count) {
      break;
    }
  }

  return {
    scannedMembers: offset,
    totalMembersInAudience: totalItems,
    sampledOnly: !fullMembers,
    sources: sortObjectEntriesDesc(sourceCounts).map(item => ({
      source: item.name,
      count: item.count,
      samples: sourceSamples[item.name] || [],
    })),
    statuses: sortObjectEntriesDesc(statusCounts).map(item => ({
      status: item.name,
      count: item.count,
    })),
    tags: sortObjectEntriesDesc(tagCounts),
  };
}

async function fetchConnectedApps(client) {
  const response = await client.authorizedApps.list({ count: 1000 });
  return (response.apps || []).map(app => ({
    id: app.id,
    name: app.name,
    description: app.description || null,
    users: app.users || [],
  }));
}

async function fetchEcommerceSignals(client, maxStores) {
  const response = await client.ecommerce.stores({ count: maxStores });
  const stores = response.stores || [];
  const details = [];

  for (const store of stores.slice(0, maxStores)) {
    try {
      const [ordersResponse, customersResponse] = await Promise.all([
        client.ecommerce.getStoreOrders(store.id, { count: 3 }),
        client.ecommerce.getAllStoreCustomers(store.id, { count: 3 }),
      ]);

      details.push({
        id: store.id,
        name: store.name,
        platform: store.platform,
        currencyCode: store.currency_code || null,
        orderCount: store.order_count ?? null,
        customerCount: store.customer_count ?? null,
        sampleOrders: (ordersResponse.orders || []).map(order => ({
          id: order.id,
          processedAt: order.processed_at_foreign || null,
          financialStatus: order.financial_status || null,
          fulfillmentStatus: order.fulfillment_status || null,
          currencyCode: order.currency_code || null,
          total: order.order_total || order.total || null,
          email: order.customer?.email_address || null,
        })),
        sampleCustomers: (customersResponse.customers || []).map(customer => ({
          id: customer.id,
          email: customer.email_address,
          ordersCount: customer.orders_count ?? null,
          totalSpent: customer.total_spent ?? null,
        })),
      });
    } catch (error) {
      details.push({
        id: store.id,
        name: store.name,
        platform: store.platform,
        error: error.message,
      });
    }
  }

  return {
    storeCount: stores.length,
    stores: details,
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const validation = validateConfig();

  if (!validation.valid) {
    console.error('Configuration errors:');
    for (const error of validation.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  const client = initMailchimp();
  const listId = config.mailchimp.listId;

  const [audienceOverview, memberSignals, connectedApps, ecommerceSignals] = await Promise.all([
    fetchAudienceOverview(client, listId),
    fetchMemberSignals(client, listId, args.fullMembers),
    fetchConnectedApps(client),
    fetchEcommerceSignals(client, args.maxStores),
  ]);

  const report = {
    generatedAt: new Date().toISOString(),
    accountServer: config.mailchimp.serverPrefix,
    audienceId: listId,
    audience: audienceOverview.list,
    mergeFields: audienceOverview.mergeFields,
    segments: audienceOverview.segments,
    connectedApps,
    ecommerce: ecommerceSignals,
    memberSignals: {
      scannedMembers: memberSignals.scannedMembers,
      totalMembersInAudience: memberSignals.totalMembersInAudience,
      sampledOnly: memberSignals.sampledOnly,
      sources: memberSignals.sources,
      statuses: memberSignals.statuses,
      topTags: memberSignals.tags.slice(0, args.maxTags),
    },
  };

  const output = JSON.stringify(report, null, 2);
  if (args.output) {
    const outputPath = path.resolve(args.output);
    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(`Mailchimp audit saved to ${outputPath}`);
  } else {
    console.log(output);
  }
}

run().catch(error => {
  console.error('Failed to run Mailchimp audit:', error.message);
  process.exit(1);
});
