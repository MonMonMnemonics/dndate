import { APITester } from "../components/APITester";

export function HomePage() {
  return (
    <div className="app bg-black">
      <h1>Bun + React</h1>
      <p>
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
      <APITester />
    </div>
  );
}

export default HomePage;
