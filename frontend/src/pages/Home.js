import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";

const STEPS = [
  {
    title: "Create or join a room",
    body: "Start a room for your flat or PG, or join one with a room code in seconds.",
  },
  {
    title: "Add your roommates",
    body: "Everyone joins with just their name - no accounts or passwords needed.",
  },
  {
    title: "Record expenses",
    body: "Log groceries, rent, bills, or anything else as soon as you pay for it.",
  },
  {
    title: "See who paid and who owes",
    body: "Room Pay works out an equal share and shows exactly who owes what.",
  },
];

export default function Home() {
  return (
    <div>
      <header className="navbar">
        <div className="container navbar-inner">
          <div className="brand">
            <span className="brand-mark">R</span>
            Room Pay
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-inner">
          <div>
            <h1>Manage shared expenses with your roommates - simply and transparently.</h1>
            <p className="lede">
              Room Pay keeps every grocery run, bill, and rent split in one place, so your
              flat or PG never loses track of who paid for what.
            </p>
            <div className="hero-actions">
              <Link to="/create-room">
                <Button size="lg">Create Room</Button>
              </Link>
              <Link to="/join-room">
                <Button variant="secondary" size="lg">
                  Join Room
                </Button>
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=900&q=80"
              alt="Roommates unpacking shared groceries in a bright kitchen"
              loading="lazy"
              onError={(e) => {
                e.target.parentElement.style.display = "none";
              }}
            />
          </div>
        </div>
      </section>

      <section className="steps-section">
        <div className="container">
          <h2>How Room Pay works</h2>
          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <div className="step-card" key={step.title}>
                <div className="step-index">{String(i + 1).padStart(2, "0")}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
