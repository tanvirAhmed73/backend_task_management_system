export default () => ({
  app: {
    name: process.env.APP_NAME || 'backend_task_management_system',
    port: Number.parseInt(process.env.PORT ?? '', 10) || 5000,
  },
});
