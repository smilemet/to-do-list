const applyDotenv = (dotenv) => {
  dotenv.config();
  return {
    mongoURI: process.env.MONGO_URI,
    port: process.env.PORT,
    origin: process.env.ORIGIN,
  };
};

export default applyDotenv;
