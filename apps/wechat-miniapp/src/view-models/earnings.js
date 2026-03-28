export const buildEarningsModel = (snapshot) => ({
  title: snapshot.title,
  summary: snapshot.summary,
  cards: snapshot.metrics
});
