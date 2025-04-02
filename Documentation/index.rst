.. meta::
    :description lang=en:
        HINA: A Learning Analytics Tool for Heterogenous Interaction Network Analysis in Python

.. .. image:: https://raw.githubusercontent.com/baiyueh/PANINIpy/main/Documentation/_static/pixel_paninipy.png
..     :width: 250px

-------------------------------------


# `HINA`: A Learning Analytics Tool for `H`eterogenous `I`nteraction `N`etwork `A`nalysis in Python 

HINA is a learning analytics tool that models and analyzes heterogenous interactions in learning processes. Heterogenous interactions refer to the interactions occurring between different types of entities during learning processes, such as students’ interactions with learning objects or students’ display of different behaviors coded using multimodal process data. 

**Heterogenous interaction networks (HINs)** consist of different sets of nodes and edges connecting nodes from different sets. Each node in a heterogenous interaction network (HIN) can represent any meaningful entity reflecting a certain object or construct in a learning process, such as a student, group of students, coded behavior, or learning artefact. Edges in HINs pair nodes from different sets and can reflect affiliations, associations, or interactions among the nodes for modeling a specific learning process.

**Heterogenous interaction network analysis (HINA)** offers a flexible, adaptive, and widely applicable method to model a wide variety of interactions that can occur during the learning processes, across individual learning, group learning, and community learning. 


Modules
========

### hina.construction

- **Heterogeneous Interaction Network Construction**: Provides functions to construct Heterogeneous Interaction Networks (HINs) (see examples above) directly from input learning process data. The methods in this module are designed to handle the typical
    data format encountered for learning process data traces, supporting seamless integration with learning analytics workflows.  

### hina.individual

- **Individual-level Analysis**: Provides functions to compute the node-level measures gauging the quantity and diversity
    of individuals’ connections to different learning constructs. Students’ group information and construct attributes
    can be flexibly manipulated for different applications. 

### hina.dyad

- **Dyadic Analysis**: Provides methods to identify statistically significant edges in the heterogeneous interaction
    network relative to different null models of interaction structure, which can be specified by the user.  

### hina.mesoscale

- **Mesoscale Clustering**: Provides methods for clustering nodes in a heterogeneous interaction network according to shared interaction structure, to automatically learn the number of clusters from heterogeneity in the interaction data to find a mesoscale representation. Utilizes a novel method based on data compression for parsimonious inference. If the input is a tripartite representation of heterogeneous interaction network, the function also returns the projected bipartite networks of the related constructs of individuals within each cluster.  

### hina.visualization

- **Visualization**: Provides network visualization functionalities for heterogeneous interaction networks.
    Users can generate a customizable network visualization using a specified layout, allowing for the pruning of insignificant edges,
    grouping of nodes based on engagement patterns, and customization of the graph's appearance.
    Users can also visualize HINs with a novel community-based layout, emphasizing the underlying bipartite community structure.
  
### hina.app

- **HINA Dashboard**: Provides functions to deploy a dashboard that includes a web-based interface for data analysis and visualization.
  
    1. The dashboard serves as a web-based tool for conducting learning analytics with HINA using an intuitive user interface,
       enabling users to conduct the individual-, dyadic- and mesoscale-level analysis available in the package without any programming.
    2. The dashboard also allows teachers and students to visualize, interpret, and communicate HINA results effectively.
    
    This dual functionality supports both data analysis and the sharing of actionable insights in an interactive and user-friendly manner,
    making it a versatile tool for both data analytics and teaching practice. 


Citation
========

If you use **HINA** in your research or projects, please cite it as follows:

.. toctree::
   :maxdepth: 2
   :caption: Installation and Contributing

   Modules/installation
   Modules/contributing


.. toctree::
   :maxdepth: 2
   :caption: Modules

   Modules/construction
   Modules/individual
   Modules/dyad
   Modules/mesoscale
   Modules/visualization
   Modules/dashboard


.. Attribution
.. =============================================

.. The logo for this package was enhanced using **Stable Diffusion model**, an AI-based generative model created by Robin Rombach, Patrick Esser and contributors. 

.. The model is released under the **CreativeML Open RAIL-M License**. For more details on the model and its licensing, refer to the following:

.. - Stable Diffusion Project: https://stability.ai/
.. - CreativeML Open RAIL-M License: https://github.com/CompVis/stable-diffusion/blob/main/LICENSE
