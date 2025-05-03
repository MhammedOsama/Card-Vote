import React, { useState, useEffect } from "react";
import truth from "../src/assets/Truth.mp4";
import liar from "../src/assets/Liar.mp4";
import "./App.css";
import logo from "./assets/finlogo.png";

function Voting() {
  const [selectedLiar, setSelectedLiar] = useState(null);

  const [showMessage, setShowMessage] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [appear, setAppear] = useState(false);
  const [results, setResults] = useState({
    correct: 0,
    wrong: 0,
    allResponses: [],
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔐 Replace with your secure auth method in real projects

  const correctAnswer = { liar: "video1", truth: "video2" };
  const authToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  useEffect(() => {
    const verifyAdminAccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const adminKey = urlParams.get("admin");

      if (!adminKey) return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "https://apipermisson.runasp.net/api/Auth/adminAccess",
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!response.ok) {
          throw new Error(
            `Admin verification failed with status ${response.status}`
          );
        }

        const data = await response.json();
        if (adminKey === data.secretKey || data.isAdmin) {
          setIsAdmin(true);
          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch (error) {
        console.error("Admin verification error:", error);
        setError("Failed to verify admin access");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdminAccess();
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://apipermisson.runasp.net/api/Auth/GetVotes",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        throw new Error("Unauthorized: Invalid or expired token.");
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch votes with status ${response.status}`);
      }

      const data = await response.json();
      processVotes(data);
    } catch (err) {
      console.error("Error fetching votes:", err);
      setError(err.message || "Failed to load voting data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const processVotes = (votes) => {
    const userVotes = Array.isArray(votes) ? votes : [];
    const correctCount = userVotes.reduce(
      (acc, vote) => (vote.selected_liar === "video1" ? acc + 1 : acc),
      0
    );

    setResults({
      correct: correctCount,
      wrong: userVotes.length - correctCount,
      allResponses: isAdmin ? userVotes : [],
    });
  };

  const sendChoice = async (liarChoice) => {
    setIsLoading(true);
    setError(null);
    try {
      const isCorrect = liarChoice === correctAnswer.liar;
      const choiceValue =
        liarChoice === "video1" ? "liar_video1" : "liar_video2";

      const response = await fetch(
        "https://apipermisson.runasp.net/api/Auth/Vote",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            choicee: choiceValue,
            is_correct: isCorrect,
            userType: "voter",
          }),
        }
      );

      if (response.status === 401) {
        throw new Error("Unauthorized: Invalid or expired token.");
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Vote failed with status ${response.status}`
        );
      }

      const updatedVotes = await response.json();
      processVotes(updatedVotes);
    } catch (err) {
      console.error("Error submitting vote:", err);
      setError(err.message || "Failed to submit your vote.");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (selectedLiar) {
      setShowMessage(true);
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 1000); // 1 second

      return () => clearTimeout(timer);
    }
  }, [selectedLiar]);

  const handleChoice = (liarChoice) => {
    setSelectedLiar(liarChoice);
    sendChoice(liarChoice);
    setAppear(true);

    setTimeout(() => setShowThankYou(true), 1000);
  };

  // 🔐 Admin Dashboard
  if (isAdmin) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <h1>Admin Dashboard</h1>
        {isLoading && <p>Loading data...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <div
          style={{
            background: "#f5f5f5",
            padding: "15px",
            borderRadius: "5px",
            marginBottom: "20px",
          }}>
          <h3>Total Votes: {results.correct + results.wrong}</h3>
          <p>✅ Correct: {results.correct}</p>
          <p>❌ Wrong: {results.wrong}</p>
          <p>
            Success Rate:{" "}
            {Math.round(
              (results.correct / (results.correct + results.wrong || 1)) * 100
            )}
            %
          </p>
        </div>

        <h3>All Responses</h3>
        {results.allResponses.length > 0 ? (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#eee" }}>
                  <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                    Time
                  </th>
                  <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                    Choice
                  </th>
                  <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                    Correct?
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.allResponses.map((response, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      {new Date(response.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      {response.choice === "liar_video1"
                        ? "Video 1"
                        : "Video 2"}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        border: "1px solid #ddd",
                        color: response.is_correct ? "green" : "red",
                      }}>
                      {response.is_correct ? "✅" : "❌"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No votes recorded yet</p>
        )}

        <button
          onClick={fetchVotes}
          disabled={isLoading}
          style={{
            marginTop: "20px",
            padding: "10px 15px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}>
          {isLoading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>
    );
  }

  // 🔘 Regular Voting View
  return (
    <div className='all bg-[#0B1223] w-screen h-screen text-white'>
      <header className='App-header md:p-8 p-4'>
        <img src={logo} className='App-logo' alt='logo' />
      </header>
      <div className='container mx-auto px-4 py-10'>
        <div className='head text-center mb-15'>
          <h1 className='lg:text-5xl text-3xl font-bold text-white'>
            EYE OF VERITAS
          </h1>
        </div>

        {showMessage && (
          <div className='bg-[#043763] md:p-4 p-2 rounded-lg mt-4 inline-block absolute -top-1 left-5 z-10'>
            <p>
              ✅ Thank you for voting video
              <span className='font-semibold px-1'>
                {selectedLiar === "video1" ? 1 : 2}
              </span>{" "}
              as the liar.
            </p>
          </div>
        )}

        {showThankYou && (
          <div className='fixed inset-0 bg-[#000000f0] bg-opacity-60 flex justify-center items-center z-50'>
            <span>
              <i
                className='fa-solid fa-xmark absolute top-2 right-5 text-white cursor-pointer'
                onClick={() => setShowThankYou(false)}></i>
            </span>
            <div className='card animated'>
              <div className='border' />
              <div className='content'>
                <div className='logo'>
                  <div className='logo1'>
                    <svg
                      viewBox='0 0 100 40'
                      xmlns='http://www.w3.org/2000/svg'
                      id='logo-main'>
                      <text x='0' y='25' fontSize='30' fontFamily='Arial'>
                        EYE
                      </text>
                    </svg>
                  </div>

                  <div className='logo2'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 700 60'
                      id='logo-second'>
                      <text
                        x='0'
                        y='35'
                        fontSize='35'
                        fontFamily='Arial, sans-serif'>
                        OF VERITAS
                      </text>
                    </svg>
                  </div>

                  <span className='trail' />
                </div>
                <span className='logo-bottom-text'>see result on 6/15</span>
              </div>
              <span className='bottom-text'>Lairs</span>
            </div>
          </div>
        )}

        {/* Videos */}
        <div className='video flex  md:gap-14 gap-3 justify-center items-center md:mt-27 mt-20  flex-wrap'>
          <video
            className='lg:w-96 md:w-80  w-64  h-64 rounded-lg object-cover md:p-0 pb-2'
            controls>
            <source src={truth} type='video/mp4' />
          </video>
          <video
            className=' lg:w-96 md:w-80 w-64  h-64  rounded-lg object-cover md:p-0 pb-2'
            controls>
            <source src={liar} type='video/mp4' />
          </video>
        </div>

        {/* Buttons */}
        <div className='btn flex justify-center items-center pt-10 flex-wrap lg:gap-45 md:gap-30 gap-7 '>
          <button
            onClick={() => handleChoice("video1")}
            disabled={selectedLiar !== null || isLoading}
            className={`text-white font-medium rounded-lg text-sm md:px-12 px-6 md:py-2 py-1 mb-2 lg:ms-5 shadow-amber-50 shadow-sm
              ${
                selectedLiar === null
                  ? "startGlassB"
                  : "bg-gray-500 cursor-not-allowed"
              }`}>
            Choose Video 1 as Liar
          </button>
          <button
            onClick={() => handleChoice("video2")}
            disabled={selectedLiar !== null || isLoading}
            className={`text-white font-medium rounded-lg text-sm md:px-12 px-6 md:py-2 py-1 mb-3 lg:me-5 shadow-amber-50 shadow-sm
              ${
                selectedLiar === null
                  ? "submitGlassB"
                  : "bg-gray-500 cursor-not-allowed"
              }`}>
            Choose Video 2 as Liar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Voting;
