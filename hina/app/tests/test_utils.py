import pytest
import pandas as pd
import networkx as nx
import json
import base64
from hina.app.api import utils

def test_parse_contents(base64_csv):
	# Test parsing base64 encoded file contents
	df = utils.parse_contents(base64_csv, "test.csv")
	assert isinstance(df, pd.DataFrame)
	assert len(df) > 0
	assert len(df.columns) > 0

def test_parse_excel_contents(sample_xlsx):
	# Test parsing Excel file contents
	# Convert the Excel bytes to base64 encoded string
	excel_bytes = sample_xlsx.read()
	base64_excel = base64.b64encode(excel_bytes).decode('utf-8')
	df = utils.parse_contents(base64_excel, "test.xlsx")
	assert isinstance(df, pd.DataFrame)
	assert len(df) > 0
	assert len(df.columns) > 0


def test_build_hina_network(sample_df):
	# Test building a HINA network
	# Get a valid group value from the data
	valid_group = sample_df['group'].iloc[0]
	
	nx_G, pos, significant_edges = utils.build_hina_network(
		df=sample_df,
		group_col='group',
		group=valid_group,
		student_col='student',
		object1_col='object1',
		object2_col=None,
		attr_col='attr',
		pruning='none',
		layout='bipartite'
	)
	
	assert isinstance(nx_G, nx.Graph)
	assert isinstance(pos, dict)
	assert isinstance(significant_edges, list)
	
	# Check that the graph has the expected structure
	assert len(nx_G.nodes) > 0
	assert len(nx_G.edges) > 0
	
	# Test pruning parameter
	nx_G2, pos2, significant_edges2 = utils.build_hina_network(
		df=sample_df,
		group_col='group',
		group=valid_group,
		student_col='student',
		object1_col='object1',
		object2_col=None,
		attr_col='attr',
		pruning={"fix_deg": None, "alpha": 0.8},
		layout='bipartite'
	)
	assert isinstance(significant_edges2, list)

	nx_G3, pos3, significant_edges3 = utils.build_hina_network(
		df=sample_df,
		group_col='group',
		group=valid_group,
		student_col='student',
		object1_col='object1',
		object2_col='object2',
		attr_col='attr',
		pruning={"fix_deg": None, "alpha": 0.01},
		layout='bipartite'
	)
	assert isinstance(significant_edges3, list)

	nx_G4, pos4, significant_edges4 = utils.build_hina_network(
		df=sample_df,
		group_col='group',
		group=valid_group,
		student_col='student',
		object1_col='object1',
		object2_col=None,
		attr_col='attr',
		pruning=True,
		layout='bipartite'
	)
	assert isinstance(significant_edges4, list)
    

def test_build_clustered_network(sample_df):
	# Test building a clustered network
	nx_G, pos, significant_edges, cluster_labels, compression_ratio, object_object_graphs = utils.build_clustered_network(
		df=sample_df,
		group_col='group',
		student_col='student',
		object1_col='object1',
		object2_col=None,
		attr_col='attr',
		pruning='none',
		layout='bipartite',
		number_cluster=None
	)
	
	assert isinstance(nx_G, nx.Graph)
	assert isinstance(pos, dict)
	assert isinstance(significant_edges, list)
	assert isinstance(cluster_labels, dict)
	assert isinstance(compression_ratio, float)
	assert isinstance(object_object_graphs, dict)

def test_cy_elements_from_graph(sample_graph_pos):
	# Test converting NetworkX graph to Cytoscape elements
	G, pos = sample_graph_pos
	elements = utils.cy_elements_from_graph(G, pos)
	
	assert isinstance(elements, list)
	assert len(elements) > 0
	
	# Check that nodes and edges are properly formatted
	nodes = [e for e in elements if 'source' not in e['data']]
	edges = [e for e in elements if 'source' in e['data']]
	
	assert len(nodes) == len(G.nodes)
	assert len(edges) == len(G.edges)
	
	# Check node format
	for node in nodes:
		assert 'id' in node['data']
		assert 'position' in node

def test_get_bipartite(sample_df):
	# Test creating a bipartite graph
	B = utils.get_bipartite(
		df=sample_df,
		student_col='student',
		object_col='object1',
		attr_col='attr',
		group_col='group'
	)
	
	assert isinstance(B, nx.Graph)
	assert len(B.nodes) > 0
	assert len(B.edges) > 0
	
	# Check bipartite attributes
	student_nodes = [n for n, d in B.nodes(data=True) if d.get('bipartite') == 'student']
	object_nodes = [n for n, d in B.nodes(data=True) if d.get('bipartite') == 'object1']
	
	assert len(student_nodes) > 0
	assert len(object_nodes) > 0

def test_get_tripartite(sample_df):
	# Test creating a tripartite graph
	T = utils.get_tripartite(
		df=sample_df,
		student_col='student',
		object1_col='object1',
		object2_col='object2',
		group_col='group'
	)
	
	assert isinstance(T, nx.Graph)
	assert len(T.nodes) > 0
	assert len(T.edges) > 0
	
	# Check node attributes
	student_nodes = [n for n, d in T.nodes(data=True) if d.get('bipartite') == 'student']
	object_nodes = [n for n, d in T.nodes(data=True) if 'bipartite' in d and d.get('bipartite') != 'student']
	
	assert len(student_nodes) > 0
	assert len(object_nodes) > 0
	
	# Check that object nodes include the combined format nodes
	combined_nodes = [n for n in T.nodes() if isinstance(n, str) and '**' in n]
	assert len(combined_nodes) > 0

if __name__ == "__main__":
	pytest.main()