`rehire` is improved [`rewire`](https://github.com/jhnns/rewire)

It's used with same style, but adds next features:
- method `__reset__` to reset all mocked objects: `rehire.__reset__()`
- second argument is patched modules like in [`proxyquire`](https://github.com/thlorenz/proxyquire):
  `rehire('./my-mod', { 'fs': { rmdir: () => {} }, './some-module': {} });`