from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import pandas as pd
from hina.app.api import utils
import base64

app = FastAPI(title="HINA REST API")

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    # Encode the file contents in base64 (without header)
    encoded = contents 
    df = utils.parse_contents(base64.b64encode(encoded).decode('utf-8'))
    groups = list(df['group'].unique()) if 'group' in df.columns else ["All"]
    return {
        "columns": df.columns.tolist(),
        "groups": groups,
        "data": df.to_json(orient="split")
    }

@app.post("/build-hina-network")
async def build_hina_network_endpoint(
    data: str = Form(...),
    group: str = Form(...),
    attribute1: str = Form(...),
    attribute2: str = Form(...),
    pruning: str = Form(...),  # "none" or "custom"
    alpha: float = Form(0.05),
    fix_deg: str = Form("Set 1"),
    layout: str = Form("spring")
):
    df = pd.read_json(data, orient="split")
    pruning_param = {"alpha": alpha, "fix_deg": fix_deg} if pruning=="custom" else "none"
    G, pos = utils.build_hina_network(df, group, attribute1, attribute2, pruning_param, layout)
    elements = utils.cy_elements_from_graph(G, pos)
    return {"elements": elements}

@app.post("/build-cluster-network")
async def build_cluster_network_endpoint(
    data: str = Form(...),
    group: str = Form(...),
    attribute1: str = Form(...),
    attribute2: str = Form(...),
    pruning: str = Form(...),
    alpha: float = Form(0.05),
    fix_deg: str = Form("Set 1"),
    layout: str = Form("spring"),
    clustering_method: str = Form("modularity")
):
    df = pd.read_json(data, orient="split")
    pruning_param = {"alpha": alpha, "fix_deg": fix_deg} if pruning=="custom" else "none"
    nx_G, pos = utils.build_clustered_network(df, group, attribute1, attribute2, clustering_method, pruning=pruning_param, layout=layout)
    elements = utils.cy_elements_from_graph(nx_G, pos)
    return {"elements": elements}

@app.post("/quantity-diversity")
async def quantity_diversity_endpoint(
    data: str = Form(...),
    attribute1: str = Form(...),
    attribute2: str = Form(...),
    weight_col: str = Form(...)
):
    df = pd.read_json(data, orient="split")
    if weight_col == "equal_weight":
        df["equal_weight"] = 1
        weight_col = "equal_weight"
    q, d = utils.quantity_and_diversity(df, student_col=attribute1, task_col=attribute2, weight_col=weight_col)
    return {"quantity": q, "diversity": d}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
