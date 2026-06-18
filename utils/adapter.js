class SiteAdapter {
  constructor() {
    this.adapters = {
      'bilibili.com': {
        name: 'B站',
        getVideoElement: () => {
          return document.querySelector('.bpx-player-video-wrap video') ||
                 document.querySelector('#bilibili-player video') ||
                 document.querySelector('video');
        },
        getVideoName: () => {
          return document.querySelector('.video-title')?.textContent?.trim() ||
                 document.title.replace(/_bilibili_哔哩哔哩$/, '').trim();
        }
      },
      'youtube.com': {
        name: 'YouTube',
        getVideoElement: () => {
          return document.querySelector('#movie_player video') ||
                 document.querySelector('video.html5-main-video') ||
                 document.querySelector('video');
        },
        getVideoName: () => {
          return document.querySelector('#title h1')?.textContent?.trim() ||
                 document.title.replace(' - YouTube', '').trim();
        }
      },
      'youku.com': {
        name: '优酷',
        getVideoElement: () => {
          return document.querySelector('.youku-layer video') ||
                 document.querySelector('#player video') ||
                 document.querySelector('video');
        },
        getVideoName: () => {
          return document.querySelector('.video-title')?.textContent?.trim() ||
                 document.title.replace(/_优酷网$/, '').trim();
        }
      },
      'iqiyi.com': {
        name: '爱奇艺',
        getVideoElement: () => {
          return document.querySelector('.qy-player-wrap video') ||
                 document.querySelector('#player video') ||
                 document.querySelector('video');
        },
        getVideoName: () => {
          return document.querySelector('.video-title')?.textContent?.trim() ||
                 document.title.replace(/_爱奇艺$/, '').trim();
        }
      },
      'v.qq.com': {
        name: '腾讯视频',
        getVideoElement: () => {
          return document.querySelector('.txp_video_wrap video') ||
                 document.querySelector('#mod_player video') ||
                 document.querySelector('video');
        },
        getVideoName: () => {
          return document.querySelector('.video_title')?.textContent?.trim() ||
                 document.title.replace(/_腾讯视频$/, '').trim();
        }
      },
      'imooc.com': {
        name: '慕课网',
        getVideoElement: () => {
          return document.querySelector('.video-box video') ||
                 document.querySelector('#player video') ||
                 document.querySelector('video');
        },
        getVideoName: () => {
          return document.querySelector('.course-title')?.textContent?.trim() ||
                 document.title.replace(/_慕课网$/, '').trim();
        }
      },
      'iclass.cn': {
        name: '慕课网(iclass)',
        getVideoElement: () => {
          return document.querySelector('video');
        },
        getVideoName: () => {
          return document.title;
        }
      }
    };
  }

  getAdapter() {
    const hostname = window.location.hostname;
    for (const [domain, adapter] of Object.entries(this.adapters)) {
      if (hostname.includes(domain)) {
        return adapter;
      }
    }
    return this.getDefaultAdapter();
  }

  getDefaultAdapter() {
    return {
      name: '通用',
      getVideoElement: () => {
        return document.querySelector('video');
      },
      getVideoName: () => {
        const video = document.querySelector('video');
        if (video?.title) return video.title;
        if (video?.src) {
          const filename = video.src.split('/').pop().split('?')[0];
          return filename || document.title;
        }
        return document.title;
      }
    };
  }

  getVideoName() {
    const adapter = this.getAdapter();
    return adapter.getVideoName();
  }

  getVideoElement() {
    const adapter = this.getAdapter();
    return adapter.getVideoElement();
  }
}

window.siteAdapter = new SiteAdapter();
