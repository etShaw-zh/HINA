from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import pandas as pd
from hina.app.api import utils
import base64
from io import StringIO

app = FastAPI(title="HINA REST API")

origins = [
    # "http://localhost:3000",
    "*"
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
    df = utils.parse_contents(base64.b64encode(encoded).decode('utf-8'), file.filename)
    groups = list(df['group'].unique()) if 'group' in df.columns else ["All"]
    return {
        "columns": df.columns.tolist(),
        "groups": groups,
        "data": df.to_json(orient="split")
    }

@app.post("/build-hina-network")
async def build_hina_network_endpoint(
    data: str = Form(...),
    group_col: str = Form(None),  
    group: str = Form(...),
    student_col: str = Form(...),  
    object1_col: str = Form(...),  
    attr_col: str = Form(None),   
    pruning: str = Form(...),     # "none" or "custom"
    alpha: float = Form(0.05),
    fix_deg: str = Form("Set 1"),
    layout: str = Form("bipartite")
):
    attr_col = None if attr_col in ["none", "null", "undefined", ""] else attr_col
    group_col = None if group_col in ["none", "null", "undefined", ""] else group_col
    df = pd.read_json(StringIO(data), orient="split")

    pruning_param = {"alpha": alpha, "fix_deg": fix_deg} if pruning == "custom" else "none"

    nx_G, pos, significant_edges = utils.build_hina_network(
        df=df, 
        group_col=group_col, 
        group=group, 
        student_col=student_col, 
        object1_col=object1_col, 
        attr_col=attr_col,
        pruning=pruning_param, 
        layout=layout
    )
    elements = utils.cy_elements_from_graph(nx_G, pos)
    
    return {
        "elements": elements,
        "significant_edges": significant_edges
    }


@app.post("/build-cluster-network")
async def build_cluster_network_endpoint(
    data: str = Form(...),
    group: str = Form(...),
    attribute1: str = Form(...),
    attribute2: str = Form(...),
    pruning: str = Form(...), # "none" or "custom"
    alpha: float = Form(0.05),
    fix_deg: str = Form("Set 1"),
    layout: str = Form("spring"),
    number_cluster: str = Form(None)
):
    df = pd.read_json(StringIO(data), orient="split")
    pruning_param = {"alpha": alpha, "fix_deg": fix_deg} if pruning == "custom" else "none"
    nx_G, pos, cluster_labels = utils.build_clustered_network(
        df, group, attribute1, attribute2, number_cluster,
        pruning=pruning_param, layout=layout
    )
    elements = utils.cy_elements_from_graph(nx_G, pos)
    return {
        "elements": elements,
        "cluster_labels": cluster_labels
    }

@app.post("/quantity-diversity")
async def quantity_diversity_endpoint(
    data: str = Form(...),
    attribute1: str = Form(...),
    attribute2: str = Form(...)
):
    df = pd.read_json(StringIO(data), orient="split")
    q, d = utils.quantity_and_diversity(df, student_col=attribute1, task_col=attribute2)
    return {"quantity": q, "diversity": d}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
