import { useState } from "react";

function Chatbox() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      setAnswer(data.answer);
    } catch (error) {
      setAnswer("Error connecting to backend.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h2>Ask Campus AI</h2>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type your question..."
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />
      <button onClick={askAI} style={{ padding: "10px 20px" }}>
        Ask
      </button>
      {loading ? <p>Loading...</p> : <p><strong>Answer:</strong> {answer}</p>}
    </div>
  );
}

export default Chatbox;
