# %% 
import numpy as np 
import scipy 
from scipy.stats import multivariate_normal, norm 
from sklearn.cluster import KMeans 

class GMM(): 
    """only a univariate case for the GMM models"""
    def __init__(self, num_clusters, iters, tries=10, tolerance=1e-16, kmeans_init=False): 
        self.k = num_clusters
        self.means = np.random.randn(self.k)
        self.sigmas = np.abs(np.random.randn(self.k))
        self.mixture_weights = np.ones(self.k) / self.k
        self.made_probs = False
        self.iters = iters
        self.tries = tries 
        self.tolerance = tolerance
        self.kmeans_init = kmeans_init
    
    def _expectation(self, X): 
        # compute probabilities P(x_i belongs to cluster K)
        # matrix shape is going to be (N, k) 
        N = X.shape[0]
    
        for k in range(self.k): 
            # for each cluster 
            mean, sigma, mixture_weight = self.means[k], self.sigmas[k], self.mixture_weights[k]
            if (np.isnan(mean) or np.isnan(sigma)): 
                return 
            self.cluster_probabilities[:, k] = mixture_weight * multivariate_normal.pdf(X, mean=mean, cov=sigma)
        
        # divide column wise by the probabilities of all of them  
        self.cluster_probabilities = self.cluster_probabilities/np.expand_dims(np.sum(self.cluster_probabilities, axis = 1), 1)
        print(self.cluster_probabilities)
        
    def _maximization(self, X): 
        """step in order to maximize the likelihood"""
        N = X.shape[0]
        for k in range(self.k): 
            # update the means, sigmas, and mixture weights 
            sum_cluster_probs = np.sum(self.cluster_probabilities[:, k])
            if (sum_cluster_probs == 0): 
                return # will terminate anyways 
            
            updated_mean = np.sum(X * self.cluster_probabilities[:, k]) / sum_cluster_probs
            self.sigmas[k] = np.sum(self.cluster_probabilities[:, k] * np.power(X - self.means[k], 2)) / sum_cluster_probs
            self.means[k] = updated_mean
            self.mixture_weights[k] = np.sum(self.cluster_probabilities[:, k]) / N # yik
        
        if np.isnan(np.sum(self.mixture_weights)):
            return 
        
        assert np.sum(self.mixture_weights) - 1 < 1e-3, f"Total Weights Should be Equal to 1 but Equals: {np.sum(self.mixture_weights)}"
        
    def _log_likelihood(self): 
        return np.sum(np.log(np.sum(self.cluster_probabilities, axis=1)))
    
    def fit_data(self, X): 
        ll_s = []
        cur_ll = -1
        N = X.shape[0]

        # initialization with KMeans
        if self.kmeans_init:
            kmeans = KMeans(self.k)
            _ = kmeans.fit_predict(X.reshape(-1, 1))
            self.means = kmeans.cluster_centers_.flatten()
        
        self.params = []
        self.lls = []
        for trie in range(self.tries): 
            ignore_trie = False 
            for i in range(self.iters): 
                if i == 0: 
                    self.cluster_probabilities = np.zeros((N, self.k)) 
                    cur_ll = self._log_likelihood()

                self._expectation(X)
                self._maximization(X)
                            
                new_ll = self._log_likelihood() 

                if np.abs(new_ll - cur_ll) < self.tolerance and i != 0: 
                    # converged 
                    print(new_ll - cur_ll)
                    print(f"Converged after {i + 1} iterations.")
                    break 
                
                ll_s.append(new_ll)
                
                cur_ll = new_ll 
                
                if cur_ll == np.nan: 
                    ignore_trie = True
                    break
                
            if ignore_trie: continue 
            self.params.append([self.means, self.sigmas, self.mixture_weights])
            self.lls.append(self._log_likelihood())
            # reset completely 
            self.means = np.random.randn(self.k)
            self.sigmas = np.abs(np.random.randn(self.k))
            self.mixture_weights = np.ones(self.k) / self.k
        
        params = self.params[np.argmax(self.lls)]
        self.means, self.sigmas, self.mixture_weights = params 
            

import numpy as np 
from typing import List, Tuple 
import matplotlib.pyplot as plt 

"""generate data and plot."""
def generate_normal_mixture(means : List[float], sigmas : List[float], N_s : List[int]): 
    assert len(means) == len(sigmas) == len(N_s)
    X = np.array([])
    for mean, sigma, N in zip(means, sigmas, N_s): 
        X = np.concatenate((X, np.random.normal(mean, sigma, N)))
    return X 

N_s = [2000, 2000]
X = generate_normal_mixture([-3, 15], [1, 3], N_s)
# plt.hist(X)

"""train using a GMM"""
gmm = GMM(num_clusters=2, iters=100, kmeans_init=True)
gmm.fit_data(X)

print(f"means: {gmm.means} and sigmas: {gmm.sigmas}")
print(f"mixture weights: {gmm.mixture_weights}")

def plot_gmm_output(gmm:GMM): 
    plt.hist(X)
    
    xmin, xmax = -20, 25
    x = np.linspace(xmin, xmax, 10000)
    pdf_curve = np.zeros(x.shape[0])
    for mean, sigma, mixture_weight in zip(gmm.means, gmm.sigmas, gmm.mixture_weights): 
        pdf_curve += norm.pdf(x, mean, sigma) * mixture_weight
    
    plt.plot(x, pdf_curve * np.sum(N_s))
    plt.title("Final Decision")
    plt.show()
    
    plt.plot(x, pdf_curve * np.sum(N_s))

plot_gmm_output(gmm)
# %%

        
        
    
            
        
        