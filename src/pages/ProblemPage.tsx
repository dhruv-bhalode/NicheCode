import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ProblemPage = () => {
  const { slug } = useParams();
  const [question, setQuestion] = useState<any>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      const res = await fetch(`http://localhost:5001/api/leetcode/${slug}`);
      const data = await res.json();
      setQuestion(data);
    };

    fetchProblem();
  }, [slug]);

  if (!question) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{question.title}</h1>
      <p><strong>Difficulty:</strong> {question.difficulty}</p>

      <div
        dangerouslySetInnerHTML={{ __html: question.content }}
      />
    </div>
  );
};

export default ProblemPage;
