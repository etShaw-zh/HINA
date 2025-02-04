import base64
import io
import dash
from dash import dcc, html, Input, Output, State, no_update
import dash_cytoscape as cyto
import dash_table
import pandas as pd
import networkx as nx
from hina.dyad.significant_edges import prune_edges
from hina.mesoscale.clustering import cluster_nodes
from hina.individual.quantity_diversity import get_bipartite, quantity_and_diversity

#############################
# Helper Functions
#############################

def parse_contents(contents, filename):
    """Decodes an uploaded CSV file and returns a DataFrame."""
    content_type, content_string = contents.split(',')
    decoded = base64.b64decode(content_string)
    try:
        df = pd.read_csv(io.StringIO(decoded.decode('utf-8')))
    except Exception as e:
        return None, f"Error processing file: {str(e)}"
    return df, f"{filename} uploaded successfully!"

def build_hina_network(df, group, attribute_1, attribute_2, pruning, layout):
    """
    Build a NetworkX graph for the HINA network using bnapy logic.
    Node labels are converted to strings.
    """
    if attribute_1 is None or attribute_2 is None:
        raise ValueError("Both attribute_1 and attribute_2 must be specified.")
    if group != 'All':
        df = df[df['group'] == group]
    
    G = nx.Graph()
    for _, row in df.iterrows():
        n1 = str(row[attribute_1])
        n2 = str(row[attribute_2])
        weight = row.get('task weight', 1)
        G.add_node(n1)
        G.add_node(n2)
        G.add_edge(n1, n2, weight=weight)
    
    # Apply pruning if specified.
    if pruning != "none":
        edge_tuples = [(u, v, d['weight']) for u, v, d in G.edges(data=True)]
        if isinstance(pruning, dict):
            significant_edges = prune_edges(edge_tuples, **pruning)
        else:
            significant_edges = prune_edges(edge_tuples)
        G_new = nx.Graph()
        for u, v, w in significant_edges:
            G_new.add_edge(u, v, weight=w)
        G = G_new

    # Set node attributes and colors.
    for node in G.nodes():
        if node in df[attribute_1].astype(str).values:
            G.nodes[node]['type'] = 'attribute_1'
            G.nodes[node]['color'] = 'blue'
        elif node in df[attribute_2].astype(str).values:
            G.nodes[node]['type'] = 'attribute_2'
            G.nodes[node]['color'] = 'grey'
        else:
            G.nodes[node]['type'] = 'unknown'
            G.nodes[node]['color'] = 'black'
    
    # Compute layout positions.
    if layout == 'bipartite':
        attribute_1_nodes = {n for n, d in G.nodes(data=True) if d['type'] == 'attribute_1'}
        if not nx.is_bipartite(G):
            raise ValueError("The graph is not bipartite; check the input data.")
        pos = nx.bipartite_layout(G, attribute_1_nodes, align='vertical', scale=2, aspect_ratio=4)
    elif layout == 'spring':
        pos = nx.spring_layout(G, k=0.2)
    elif layout == 'circular':
        pos = nx.circular_layout(G)
    else:
        raise ValueError(f"Unsupported layout: {layout}")
    return G, pos

def cy_elements_from_graph(G, pos):
    """
    Convert a NetworkX graph and positions into Cytoscape elements.
    All node IDs are forced to strings.
    """
    elements = []
    for node, data in G.nodes(data=True):
        node_str = str(node)
        x = pos[node][0] * 400 + 300
        y = pos[node][1] * 400 + 300
        elements.append({
            'data': {'id': node_str, 'label': node_str},
            'position': {'x': x, 'y': y},
            'classes': data.get('type', '')
        })
    for u, v, d in G.edges(data=True):
        elements.append({
            'data': {'source': str(u), 'target': str(v), 'weight': d.get('weight', 1)}
        })
    return elements

def build_clustered_network(df, group, attribute_1, attribute_2, clustering_method, pruning="none", layout="spring"):
    """
    Build a clustered bipartite network using bnapy's get_bipartite and cluster_nodes.
    An optional pruning parameter (either "none" or a dict) is applied before clustering.
    All node IDs are cast to strings.
    """
    if attribute_1 is None or attribute_2 is None:
        raise ValueError("Both attribute_1 and attribute_2 must be specified.")
    if group != 'All':
        df = df[df['group'] == group]
    
    G_edges = get_bipartite(df, attribute_1, attribute_2)
    if pruning != "none":
        edge_tuples = list(G_edges)
        if isinstance(pruning, dict):
            pruned = prune_edges(edge_tuples, **pruning)
        else:
            pruned = prune_edges(edge_tuples)
        G_edges = pruned
    cluster_labels = cluster_nodes(G_edges, method=clustering_method)
    nx_G = nx.Graph()
    for edge in G_edges:
        nx_G.add_edge(str(edge[0]), str(edge[1]), weight=edge[2])
    for node in nx_G.nodes():
        nx_G.nodes[node]['cluster'] = cluster_labels.get(str(node), -1)
    unique_clusters = sorted(set(cluster_labels.values()) | {-1})
    colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33']
    color_map = {}
    for i, label in enumerate(unique_clusters):
        color_map[label] = 'grey' if label == -1 else colors[i % len(colors)]
    for node in nx_G.nodes():
        cl = nx_G.nodes[node]['cluster']
        nx_G.nodes[node]['color'] = color_map.get(cl, 'black')
    if layout == 'bipartite':
        # For bipartite layout, you could add custom logic; here we use spring layout.
        pos = nx.spring_layout(nx_G, k=0.2)
    elif layout == 'spring':
        pos = nx.spring_layout(nx_G, k=0.2)
    elif layout == 'circular':
        pos = nx.circular_layout(nx_G)
    else:
        pos = nx.spring_layout(nx_G, k=0.2)
    return nx_G, pos

#############################
# Dash App Layout
#############################

app = dash.Dash(__name__, suppress_callback_exceptions=True)
server = app.server

app.layout = html.Div([
    html.H1("HINA Visualization Web App"),
    # File Upload
    dcc.Upload(
        id='upload-data',
        children=html.Div(['Drag and drop or ', html.A('Select a CSV File')]),
        style={
            'width': '90%', 'height': '60px', 'lineHeight': '60px',
            'borderWidth': '1px', 'borderStyle': 'dashed', 'borderRadius': '5px',
            'textAlign': 'center', 'margin': '10px'
        },
        multiple=False
    ),
    html.Div(id='upload-status'),
    # Store uploaded data as JSON
    dcc.Store(id='stored-data'),
    # Common dropdowns
    html.Div([
        html.Label("Group:"),
        dcc.Dropdown(
            id="common-group",
            options=[], value="All",
            style={'width': '25%', 'display': 'inline-block', 'margin-right': '10px'}
        ),
        html.Label("Attribute 1:"),
        dcc.Dropdown(
            id="common-attr1",
            options=[], value="",
            style={'width': '25%', 'display': 'inline-block', 'margin-right': '10px'}
        ),
        html.Label("Attribute 2:"),
        dcc.Dropdown(
            id="common-attr2",
            options=[], value="",
           style={'width': '25%', 'display': 'inline-block','margin-right': '10px'}
        ),
        html.Br(), html.Br(),
        html.Label("Task Weight Column:"),
        dcc.Dropdown(
            id="common-weight",
            options=[], value="",
            style={'width': '25%', 'display': 'inline-block', 'margin-right': '10px'}
        )
    ], style={'padding': '2px', 'border': '1px solid #ccc', 'margin': '2px'}),
    # Tabs
    dcc.Tabs(id='tabs', value='tab-hina', children=[
        dcc.Tab(label='HINA Network', value='tab-hina'),
        dcc.Tab(label='Clustered Network', value='tab-cluster'),
        dcc.Tab(label='Quantity & Diversity', value='tab-qd')
    ]),
    html.Div(id='tabs-content')
])

#############################
# Callbacks
#############################

# Update common dropdown options.
@app.callback(
    Output('common-group', 'options'),
    Output('common-attr1', 'options'),
    Output('common-attr2', 'options'),
    Output('common-weight', 'options'),
    Input('stored-data', 'data')
)
def update_common_dropdowns(data):
    if data is None:
        return [], [], [], []
    df = pd.read_json(data, orient='split')
    if 'group' in df.columns:
        group_options = [{'label': str(x), 'value': str(x)} for x in sorted(df['group'].unique())]
        group_options.insert(0, {'label': 'All', 'value': 'All'})
    else:
        group_options = [{'label': 'All', 'value': 'All'}]
    col_options = [{'label': col, 'value': col} for col in df.columns]
    return group_options, col_options, col_options, col_options

# Process file upload.
@app.callback(
    Output('stored-data', 'data'),
    Output('upload-status', 'children'),
    Input('upload-data', 'contents'),
    State('upload-data', 'filename')
)
def store_file(contents, filename):
    if contents is None:
        return no_update, "Awaiting file upload..."
    df, msg = parse_contents(contents, filename)
    if df is None:
        return no_update, msg
    return df.to_json(date_format='iso', orient='split'), msg

# Render tab content.
@app.callback(
    Output('tabs-content', 'children'),
    Input('tabs', 'value')
)
def render_tab(tab):
    if tab == 'tab-hina':
        return html.Div([
            html.H3("HINA Network Visualization"),
            html.Div([
                html.Label("Pruning:"),
                dcc.RadioItems(
                    id='hina-pruning',
                    options=[
                        {'label': 'No Pruning', 'value': 'none'},
                        {'label': 'Custom Pruning', 'value': 'custom'}
                    ],
                    value='none',
                    labelStyle={'display': 'inline-block', 'margin-right': '10px'}
                ),
                html.Div(id='custom-pruning-options', children=[
                    html.Label("Alpha:"),
                    dcc.Input(id='pruning-alpha', type='number', value=0.05, step=0.01, style={'margin-right': '10px'}),
                    html.Label("Fix Deg:"),
                    dcc.Input(id='pruning-fix-deg', type='text', value='Set 1')
                ], style={'display': 'none', 'margin-top': '10px'}),
                html.Br(),
                html.Label("Layout:"),
                dcc.Dropdown(
                    id='hina-layout',
                    options=[
                        {'label': 'Bipartite', 'value': 'bipartite'},
                        {'label': 'Spring', 'value': 'spring'},
                        {'label': 'Circular', 'value': 'circular'}
                    ],
                    value='spring',
                    style={'width': '50%'}
                ),
                html.Br(),
                html.Button("Update HINA Network", id='update-hina', n_clicks=0)
            ], style={'padding': '10px', 'border': '1px solid #ccc', 'margin-bottom': '10px'}),
            html.Div([
                cyto.Cytoscape(
                    id='hina-network',
                    layout={'name': 'preset'},
                    style={'width': '100%', 'height': '800px'}, #canvas size
                    elements=[],
                    zoom=1,
                    userZoomingEnabled=False,  
                    userPanningEnabled=True     # Enable dragging/panning
                ),
                html.Div([
                    html.Button("+", id="zoom-in", n_clicks=0, style={'font-size': '24px', 'margin': '2px'}),
                    html.Button("–", id="zoom-out", n_clicks=0, style={'font-size': '24px', 'margin': '2px'})
                ], style={'position': 'absolute', 'top': '10px', 'right': '10px', 'zIndex': 999})
            ], style={'position': 'relative', 'width': '100%', 'height': '800px'})
        ])
    elif tab == 'tab-cluster':
        return html.Div([
            html.H3("Clustered Network Visualization"),
            html.Div([
                html.Label("Pruning:"),
                dcc.RadioItems(
                    id='cluster-pruning',
                    options=[
                        {'label': 'No Pruning', 'value': 'none'},
                        {'label': 'Custom Pruning', 'value': 'custom'}
                    ],
                    value='none',
                    labelStyle={'display': 'inline-block', 'margin-right': '10px'}
                ),
                html.Div(id='cluster-custom-pruning-options', children=[
                    html.Label("Alpha:"),
                    dcc.Input(id='cluster-pruning-alpha', type='number', value=0.05, step=0.01, style={'margin-right': '10px'}),
                    html.Label("Fix Deg:"),
                    dcc.Input(id='cluster-pruning-fix-deg', type='text', value='Set 1')
                ], style={'display': 'none', 'margin-top': '10px'}),
                html.Br(),
                html.Label("Layout:"),
                dcc.Dropdown(
                    id='cluster-layout',
                    options=[
                        {'label': 'Bipartite', 'value': 'bipartite'},
                        {'label': 'Spring', 'value': 'spring'},
                        {'label': 'Circular', 'value': 'circular'}
                    ],
                    value='spring',
                    style={'width': '50%'}
                ),
                html.Br(),
                html.Label("Clustering Method:"),
                dcc.Dropdown(
                    id='clustering-method',
                    options=[{'label': 'Modularity', 'value': 'modularity'}],
                    value='modularity',
                    style={'width': '50%'}
                ),
                html.Br(),
                html.Button("Update Clustered Network", id='update-cluster', n_clicks=0)
            ], style={'padding': '10px', 'border': '1px solid #ccc', 'margin-bottom': '10px'}),
            html.Div([
                cyto.Cytoscape(
                    id='cluster-network',
                    layout={'name': 'preset'},
                    style={'width': '100%', 'height': '800px'},
                    elements=[],
                    zoom=1,
                    userZoomingEnabled=False,
                    userPanningEnabled=True
                ),
                html.Div([
                    html.Button("+", id="cluster-zoom-in", n_clicks=0, style={'font-size': '24px', 'margin': '2px'}),
                    html.Button("–", id="cluster-zoom-out", n_clicks=0, style={'font-size': '24px', 'margin': '2px'})
                ], style={'position': 'absolute', 'top': '10px', 'right': '10px', 'zIndex': 999})
            ], style={'position': 'relative', 'width': '100%', 'height': '800px'})
        ])
    elif tab == 'tab-qd':
        return html.Div([
            html.H3("Quantity and Diversity"),
            html.Br(),
            html.Button("Compute Quantity & Diversity", id='compute-qd', n_clicks=0),
            html.Br(),
            html.Div(id='qd-output')
        ])

# Show/hide custom pruning options in HINA tab.
@app.callback(
    Output('custom-pruning-options', 'style'),
    Input('hina-pruning', 'value')
)
def toggle_custom_pruning_hina(pruning_value):
    if pruning_value == 'custom':
        return {'display': 'block', 'margin-top': '10px'}
    else:
        return {'display': 'none'}

# Show/hide custom pruning options in Clustered tab.
@app.callback(
    Output('cluster-custom-pruning-options', 'style'),
    Input('cluster-pruning', 'value')
)
def toggle_custom_pruning_cluster(pruning_value):
    if pruning_value == 'custom':
        return {'display': 'block', 'margin-top': '10px'}
    else:
        return {'display': 'none'}

# Update HINA Network visualization.
@app.callback(
    Output('hina-network', 'elements'),
    Input('update-hina', 'n_clicks'),
    State('stored-data', 'data'),
    State('common-group', 'value'),
    State('common-attr1', 'value'),
    State('common-attr2', 'value'),
    State('hina-pruning', 'value'),
    State('pruning-alpha', 'value'),
    State('pruning-fix-deg', 'value'),
    State('hina-layout', 'value')
)
def update_hina(n_clicks, data, group, attr1, attr2, pruning_value, alpha, fix_deg, layout_choice):
    if data is None or n_clicks == 0:
        return no_update
    df = pd.read_json(data, orient='split')
    if pruning_value == 'custom':
        pruning_param = {'alpha': alpha, 'fix_deg': fix_deg}
    else:
        pruning_param = "none"
    try:
        G, pos = build_hina_network(df, group, attr1, attr2, pruning_param, layout_choice)
        elements = cy_elements_from_graph(G, pos)
    except Exception as e:
        elements = []
    return elements

# Update Clustered Network visualization.
@app.callback(
    Output('cluster-network', 'elements'),
    Input('update-cluster', 'n_clicks'),
    State('stored-data', 'data'),
    State('common-group', 'value'),
    State('common-attr1', 'value'),
    State('common-attr2', 'value'),
    State('cluster-pruning', 'value'),
    State('cluster-pruning-alpha', 'value'),
    State('cluster-pruning-fix-deg', 'value'),
    State('cluster-layout', 'value'),
    State('clustering-method', 'value')
)
def update_cluster(n_clicks, data, group, attr1, attr2, pruning_value, alpha, fix_deg, layout_choice, clustering_method):
    if data is None or n_clicks == 0:
        return no_update
    df = pd.read_json(data, orient='split')
    if pruning_value == 'custom':
        pruning_param = {'alpha': alpha, 'fix_deg': fix_deg}
    else:
        pruning_param = "none"
    try:
        nx_G, pos = build_clustered_network(df, group, attr1, attr2, clustering_method, pruning=pruning_param, layout=layout_choice)
        elements = cy_elements_from_graph(nx_G, pos)
    except Exception as e:
        elements = []
    return elements

# Compute Quantity & Diversity.
@app.callback(
    Output('qd-output', 'children'),
    Input('compute-qd', 'n_clicks'),
    State('stored-data', 'data'),
    State('common-attr1', 'value'),
    State('common-attr2', 'value'),
    State('common-weight', 'value')
)
def compute_qd(n_clicks, data, attr1, attr2, weight_col):
    if data is None or n_clicks == 0:
        return no_update
    df = pd.read_json(data, orient='split')
    q, d = quantity_and_diversity(df, student_col=attr1, task_col=attr2, weight_col=weight_col)
    table_df = pd.DataFrame({
        attr1: list(q.keys()),
        'Quantity': list(q.values()),
        'Diversity': list(d.values())
    })
    return dash_table.DataTable(
        data=table_df.to_dict('records'),
        columns=[{'name': i, 'id': i} for i in table_df.columns],
        style_table={'overflowX': 'auto'},
        page_size=10
    )

# Callback to update the zoom level of the HINA network.
@app.callback(
    Output('hina-network', 'zoom'),
    Input('zoom-in', 'n_clicks'),
    Input('zoom-out', 'n_clicks')
)
def update_hina_zoom(n_zoom_in, n_zoom_out):
    zoom = 1 * (1.2 ** n_zoom_in) * (0.8 ** n_zoom_out)
    return zoom

# Callback to update the zoom level of the Clustered network.
@app.callback(
    Output('cluster-network', 'zoom'),
    Input('cluster-zoom-in', 'n_clicks'),
    Input('cluster-zoom-out', 'n_clicks')
)
def update_cluster_zoom(n_zoom_in, n_zoom_out):
    zoom = 1 * (1.2 ** n_zoom_in) * (0.8 ** n_zoom_out)
    return zoom

#############################
# Run the App
#############################
if __name__ == '__main__':
    app.run_server(debug=True)
