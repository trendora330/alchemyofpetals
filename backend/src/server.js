const app = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🌸 Alchemy of Petals Backend Running Smoothly on Port: ${PORT}`);
});