new sst.x.DevCommand("NgrokTunnel", {
  dev: {
    autostart: true,
    command: "pnpm ngrok",
  },
});

new sst.x.DevCommand("TemporalServer", {
  dev: {
    autostart: true,
    command: "temporal server start-dev",
  },
});