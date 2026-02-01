import { Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Feed } from "@/pages/Feed";
import { PostDetail } from "@/pages/PostDetail";

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/posts/:id" element={<PostDetail />} />
      </Routes>
    </div>
  );
}

export default App;
