import fs from "fs";
import path from "path";
import csv from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

const problemSchema = new mongoose.Schema({
  title: String,
  slug: String,
  difficulty: String,
  frequency: Number,
  acceptanceRate: Number,
  topics: [String],
  companies: [String]
});

const Problem = mongoose.model("Problem", problemSchema);

const basePath = "../../leetcode-company-wise-problems";

async function importCSV() {
  const files = fs.readdirSync(basePath).filter(file => file.endsWith(".csv"));

  const problemMap = {};

  for (const file of files) {
    const company = file.replace(".csv", "");
    const filePath = path.join(basePath, file);

    await new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          const slug = row.Link.split("/problems/")[1]?.replace("/", "");

          if (!slug) return;

          if (!problemMap[slug]) {
            problemMap[slug] = {
              title: row.Title,
              slug,
              difficulty: row.Difficulty,
              frequency: parseFloat(row.Frequency),
              acceptanceRate: parseFloat(row["Acceptance Rate"]),
              topics: row.Topics.split(",").map(t => t.trim()),
              companies: [company]
            };
          } else {
            problemMap[slug].companies.push(company);
          }
        })
        .on("end", resolve);
    });
  }

  const problems = Object.values(problemMap);

  await Problem.deleteMany({});
  await Problem.insertMany(problems);

  console.log(`Inserted ${problems.length} problems`);
  mongoose.connection.close();
}

importCSV();
