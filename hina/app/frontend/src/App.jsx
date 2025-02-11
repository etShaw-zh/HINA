import React, { useState } from "react";
import axios from "axios";
import CytoscapeComponent from "react-cytoscapejs";

function App() {
  const [uploadedData, setUploadedData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [groups, setGroups] = useState([]);
  const [elements, setElements] = useState([]);
  const [group, setGroup] = useState("All");
  const [attr1, setAttr1] = useState("");
  const [attr2, setAttr2] = useState("");
  const [pruning, setPruning] = useState("none");
  const [alpha, setAlpha] = useState(0.05);
  const [fixDeg, setFixDeg] = useState("Set 1");
  const [layout, setLayout] = useState("spring");

  // Handle file upload.
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setColumns(res.data.columns);
      setGroups(res.data.groups);
      setUploadedData(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Update HINA network by calling the back-end endpoint.
  const updateHinaNetwork = async () => {
    const params = new URLSearchParams();
    params.append("data", uploadedData);
    params.append("group", group);
    params.append("attribute1", attr1);
    params.append("attribute2", attr2);
    params.append("pruning", pruning);
    params.append("alpha", alpha);
    params.append("fix_deg", fixDeg);
    params.append("layout", layout);
    try {
      const res = await axios.post(
        "http://localhost:8000/build-hina-network",
        params
      );
      setElements(res.data.elements);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>HINA Network Visualization (Vite + React)</h1>
      <input type="file" onChange={handleFileUpload} />
      {columns.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <label>Group: </label>
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <label> Attribute 1: </label>
          <select value={attr1} onChange={(e) => setAttr1(e.target.value)}>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
          <label> Attribute 2: </label>
          <select value={attr2} onChange={(e) => setAttr2(e.target.value)}>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
          <label> Pruning: </label>
          <select value={pruning} onChange={(e) => setPruning(e.target.value)}>
            <option value="none">No Pruning</option>
            <option value="custom">Custom Pruning</option>
          </select>
          {pruning === "custom" && (
            <div>
              <label> Alpha: </label>
              <input
                type="number"
                value={alpha}
                onChange={(e) => setAlpha(e.target.value)}
              />
              <label> Fix Deg: </label>
              <input
                type="text"
                value={fixDeg}
                onChange={(e) => setFixDeg(e.target.value)}
              />
            </div>
          )}
          <label> Layout: </label>
          <select value={layout} onChange={(e) => setLayout(e.target.value)}>
            <option value="spring">Spring</option>
            <option value="bipartite">Bipartite</option>
            <option value="circular">Circular</option>
          </select>
          <button onClick={updateHinaNetwork}>Update HINA Network</button>
        </div>
      )}
      <div
        style={{ height: "800px", border: "1px solid #ccc", marginTop: "20px" }}
      >
        <CytoscapeComponent
          elements={elements}
          style={{ width: "100%", height: "100%" }}
          layout={{ name: "preset" }}
        />
      </div>
    </div>
  );
}

export default App;
