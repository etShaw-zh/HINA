.. meta::
    :description lang=en:
        HINA: A Learning Analytics Tool for Heterogenous Interaction Network Analysis in Python

.. .. image:: https://raw.githubusercontent.com/baiyueh/PANINIpy/main/Documentation/_static/pixel_paninipy.png
..     :width: 250px

-------------------------------------


HINA: A Learning Analytics Tool for Heterogenous Interaction Network Analysis in Python
=============================================

*HINA*: *HINA* is is a learning analytics tool that models and analyzes heterogenous interactions during learning, equipped with modules as below:

- **Individual-level Analysis**: Provides functions to compute the node-level measures of gauging the quantity and diversity of individuals’ interactions in the learning process. New package contributions can incorporate other node-level measures for understanding individuals’ interaction patterns.
- **Dyadic Analysis**: Provides methods to identify statistically significant edges in the heterogeneous interaction network relative to multiple different null models of interaction structure, which can be specified by the user. New package contributions can incorporate other dyad-level analyses for understanding interaction patterns among pairs of nodes.
- **Mesoscale Clustering**: Provides methods for clustering nodes in a bipartite projection of the heterogeneous interaction network according to shared interaction structure, automatically learning the number of clusters from heterogeneity in the interaction data to find a mesoscale representation. New package contributions can incorporate other measures for understanding the mesoscale structure of the interaction network.
- **Visualization**: Provides network visualization functions for networks at the group level or cohort level that enable the user to easily project the heterogeneous interaction network onto any subset of node types (e.g. students, tasks, behavioral codes). These methods allow for the inclusion of various metadata such as inferred student clusters or contribution metrics, as well as pruning of the interaction network to identify significant interaction structure. Also enables visualization with Sankey diagrams for an alternative representation of the weighted networks. These visualizations come together with a web-based interface that enables interactions and user engagement. New package contributions can incorporate other relevant metadata for visualization, as well as other preprocessing tools for augmenting or modifying the network structure to highlight particular features.

Statement of Need
=============================================

Modelling learning processes using heterogenous interaction networks enables us to investigate a wide range of questions through summative measures and network inference that are tailored for the learning analytics setting. *HINA* offers analytical modules to address four specific questions of interest for learning analytics practitioners:

1. **At the node level**: How can we gauge the quantity and diversity of the heterogenous connections for a designated set of nodes?
2. **At the dyad level**: How can we extract statistically significant ties that indicate a higher level of interaction among a pair of nodes than expected under a suitable null model?
3. **At the mesoscale level**: How can we identify subgroups of entities that share similar heterogenous interaction patterns?
4. **At the network level**: How can we visualize these heterogeneous interaction networks in an interactive and informative way, using different visualization formats that are tailored for learning analytics applications?

These analytical features offered by *HINA* allow for easy access to critical measures and visualizations for learning analytics researchers and practitioners to derive insights about their learning process data. The inherent complexity of learning process data, coupled with the lack of standardized methodologies, necessitates a tailored approach to data analysis that can effectively address the specific conceptual and analytical questions posed in learning contexts. What differentiates *HINA* from existing network analysis packages such as NetworkX or iGraph is its focus on heterogeneous interaction networks for learning process data and its inclusion of specifically tailored novel metrics and visualization tools for the learning analytics setting. For example, *HINA* allows for studies exploring how to gauge individual contribution based on the interactions between students and learning artefacts, identify subgroups of students who share similar learning strategies based on their associations with behavioral and cognitive constructs during learning processes, uncover significant associations among behavioral engagement in different modalities, and design learning analytics dashboard with the visualization of heterogenous engagement to support teaching and learning practices. By packaging these tools in a compact package accessible to practitioners in the emerging field of learning analytics, particularly those less familiar with network analysis, *HINA* can provide substantial impact in the education community.  

Citation
========

.. If you use **PANINIpy** in your research or projects, please cite it as follows:

.. **BibTeX Format**

.. For BibTeX users, include the following entry in the bibliography file:

.. .. code-block:: bibtex

..     @article{Kirkley2024,
..         doi = {10.21105/joss.07312},
..         url = {https://doi.org/10.21105/joss.07312},
..         year = {2024},
..         publisher = {The Open Journal},
..         volume = {9},
..         number = {103},
..         pages = {7312},
..         author = {Alec Kirkley and Baiyue He},
..         title = {PANINIpy: Package of Algorithms for Nonparametric Inference with Networks In Python},
..         journal = {Journal of Open Source Software}
..     }

.. **APA Format**

.. For APA users, cite as:

.. Kirkley, A., & He, B. (2024). PANINIpy: Package of Algorithms for Nonparametric Inference with Networks In Python. Journal of Open Source Software, 9(103), 7312, https://doi.org/10.21105/joss.07312

.. **How to Cite**

.. To reference **PANINIpy**, one can use either the BibTeX or APA format provided above. Please ensure that the citation includes the DOI and the link to the official article for clarity and accessibility.

.. For more details, visit the official article published in the `Journal of Open Source Software <https://doi.org/10.21105/joss.07312>`_.

.. toctree::
   :maxdepth: 2
   :caption: Installation and Contributing

   Modules/installation
   Modules/contributing


.. toctree::
   :maxdepth: 2
   :caption: Modules

   Modules/individual
   Modules/dyad
   Modules/mesoscale
   Modules/visualization


.. Attribution
.. =============================================

.. The logo for this package was enhanced using **Stable Diffusion model**, an AI-based generative model created by Robin Rombach, Patrick Esser and contributors. 

.. The model is released under the **CreativeML Open RAIL-M License**. For more details on the model and its licensing, refer to the following:

.. - Stable Diffusion Project: https://stability.ai/
.. - CreativeML Open RAIL-M License: https://github.com/CompVis/stable-diffusion/blob/main/LICENSE
