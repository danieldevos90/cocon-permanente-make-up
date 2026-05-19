(function () {
  var MOBILE_MAX = 980;
  var state = null;

  function findTeamSection() {
    var headings = document.querySelectorAll('.et_pb_module_heading, .et_pb_heading_container h1, .et_pb_heading_container h2');
    for (var i = 0; i < headings.length; i++) {
      if (/team van specialisten/i.test(headings[i].textContent || '')) {
        return headings[i].closest('.et_pb_section');
      }
    }
    return document.querySelector('.et_pb_section_7');
  }

  function getMembers(section) {
    return Array.prototype.slice.call(section.querySelectorAll('.et_pb_team_member'));
  }

  function destroyCarousel() {
    if (!state) {
      return;
    }

    state.placements.forEach(function (item) {
      item.parent.appendChild(item.member);
    });

    state.sourceRows.forEach(function (row) {
      row.classList.remove('coconpm-team-carousel__source-row');
      row.style.display = '';
    });

    if (state.carousel && state.carousel.parentNode) {
      state.carousel.parentNode.removeChild(state.carousel);
    }

    state = null;
  }

  function getSlideWidth(track) {
    return track.clientWidth || 0;
  }

  function getActiveIndex(track) {
    var slideWidth = getSlideWidth(track);
    if (!slideWidth) {
      return 0;
    }
    return Math.round(track.scrollLeft / slideWidth);
  }

  function updateControls(track, dots, prevBtn, nextBtn) {
    var index = getActiveIndex(track);
    var maxIndex = track.children.length - 1;

    if (index < 0) {
      index = 0;
    }
    if (index > maxIndex) {
      index = maxIndex;
    }

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === index);
    });

    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= maxIndex;
  }

  function bindCarousel(track, dots, prevBtn, nextBtn) {
    var onScroll = function () {
      window.requestAnimationFrame(function () {
        updateControls(track, dots, prevBtn, nextBtn);
      });
    };

    track.addEventListener('scroll', onScroll, { passive: true });

    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -getSlideWidth(track), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: getSlideWidth(track), behavior: 'smooth' });
    });

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        track.scrollTo({ left: getSlideWidth(track) * index, behavior: 'smooth' });
      });
    });

    track._coconpmControls = { dots: dots, prevBtn: prevBtn, nextBtn: nextBtn };
    updateControls(track, dots, prevBtn, nextBtn);
  }

  function syncCarouselOnResize() {
    if (!state || !state.carousel) {
      return;
    }

    var track = state.carousel.querySelector('.coconpm-team-carousel__track');
    var controls = track && track._coconpmControls;
    if (!track || !controls) {
      return;
    }

    var index = getActiveIndex(track);
    var slideWidth = getSlideWidth(track);
    if (slideWidth) {
      track.scrollLeft = slideWidth * index;
    }

    updateControls(track, controls.dots, controls.prevBtn, controls.nextBtn);
  }

  function buildCarousel(section, members) {
    var placements = [];
    var sourceRows = [];

    members.forEach(function (member) {
      placements.push({ member: member, parent: member.parentElement });
      var row = member.closest('.et_pb_row');
      if (row && sourceRows.indexOf(row) === -1) {
        sourceRows.push(row);
      }
    });

    var carousel = document.createElement('div');
    carousel.className = 'coconpm-team-carousel';

    var track = document.createElement('div');
    track.className = 'coconpm-team-carousel__track';
    track.setAttribute('aria-label', 'Team carousel');

    members.forEach(function (member) {
      var slide = document.createElement('div');
      slide.className = 'coconpm-team-carousel__slide';
      slide.appendChild(member);
      track.appendChild(slide);
    });

    var nav = document.createElement('div');
    nav.className = 'coconpm-team-carousel__nav';

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'coconpm-team-carousel__btn coconpm-team-carousel__btn--prev';
    prevBtn.setAttribute('aria-label', 'Vorige');
    prevBtn.textContent = '\u2039';

    var dotsWrap = document.createElement('div');
    dotsWrap.className = 'coconpm-team-carousel__dots';

    var dots = members.map(function (_, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'coconpm-team-carousel__dot' + (index === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Ga naar teamlid ' + (index + 1));
      dotsWrap.appendChild(dot);
      return dot;
    });

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'coconpm-team-carousel__btn coconpm-team-carousel__btn--next';
    nextBtn.setAttribute('aria-label', 'Volgende');
    nextBtn.textContent = '\u203A';

    nav.appendChild(prevBtn);
    nav.appendChild(dotsWrap);
    nav.appendChild(nextBtn);

    carousel.appendChild(track);
    carousel.appendChild(nav);

    var headingRow = section.querySelector('.et_pb_heading') ?
      section.querySelector('.et_pb_heading').closest('.et_pb_row') :
      section.querySelector('.et_pb_row');

    if (headingRow && headingRow.nextSibling) {
      headingRow.parentNode.insertBefore(carousel, headingRow.nextSibling);
    } else {
      section.appendChild(carousel);
    }

    sourceRows.forEach(function (row) {
      row.classList.add('coconpm-team-carousel__source-row');
    });

    bindCarousel(track, dots, prevBtn, nextBtn);

    state = {
      section: section,
      carousel: carousel,
      placements: placements,
      sourceRows: sourceRows,
    };
  }

  function initCarousel() {
    if (window.innerWidth > MOBILE_MAX) {
      destroyCarousel();
      return;
    }

    if (state) {
      return;
    }

    var section = findTeamSection();
    if (!section) {
      return;
    }

    var members = getMembers(section);
    if (members.length < 2) {
      return;
    }

    buildCarousel(section, members);
  }

  function onResize() {
    window.clearTimeout(onResize._timer);
    onResize._timer = window.setTimeout(function () {
      if (window.innerWidth > MOBILE_MAX) {
        destroyCarousel();
        return;
      }
      if (!state) {
        initCarousel();
        return;
      }
      syncCarouselOnResize();
    }, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousel);
  } else {
    initCarousel();
  }

  window.addEventListener('load', initCarousel);
  window.addEventListener('resize', onResize);
})();
