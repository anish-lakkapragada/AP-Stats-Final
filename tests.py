# %% 
import numpy as np 
from typing import List, Tuple 
import matplotlib.pyplot as plt 
from Mixtures import GMM
# %% 
"""generate data and plot."""
def generate_normal_mixture(means : List[float], sigmas : List[float], N_s : List[int]): 
    assert len(means) == len(sigmas) == len(N_s)
    X = np.array([])
    for mean, sigma, N in zip(means, sigmas, N_s): 
        X = np.concatenate((X, np.random.normal(mean, sigma, N)))
    return X 

X = generate_normal_mixture([1, 10], [3, 2], [500, 500])
plt.hist(X)
# %%
"""train using a GMM"""
gmm = GMM(num_clusters=2, iters=100)
gmm.fit_data(X)
# %%
