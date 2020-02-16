// app/router.js
module.exports = app => {
  const { router, controller } = app;
  router.get('/index', controller.home.index);
  router.post('/upload', controller.home.upload);
  router.post('/merge', controller.home.merge);
  router.post('/check', controller.home.check);
};