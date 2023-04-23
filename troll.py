# %% 
from lmfit.models import GaussianModel
import numpy as np 
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from tqdm import trange
from sklearn.utils import shuffle
from matplotlib import pyplot as plt



DEGREE=2
NOISE_LEVEL = 3
SCALE = 10
POPULATION_N = 5000
BINS= 100
SAMPLE_N = 50
TRIALS = 1000
PARAMS = []
BETAS_X = []
BETAS_0 = [] 

X_total = SCALE * np.random.rand(POPULATION_N,)
y_total = X_total ** DEGREE
y_total += NOISE_LEVEL * np.mean(y_total) * np.random.rand(POPULATION_N,)
plt.scatter(X_total, y_total)
#bruh
# %%
def calculate_betas(): 
    _X, _y = shuffle(X_total, y_total)
    X_sample, y_sample = _X[:SAMPLE_N], _y[:SAMPLE_N]
    poly = PolynomialFeatures(degree=DEGREE, include_bias=False)
    poly_features = poly.fit_transform(X_sample.reshape(-1, 1))
    poly_reg_model = LinearRegression()
    poly_reg_model.fit(poly_features, y_sample)
    return poly_reg_model.coef_

for i in trange(TRIALS): 
    betas = calculate_betas()
    PARAMS.append(betas[-1]) # higher degree for the further index
    
# %%
fig, ax = plt.subplots(figsize=(10, 7))
# ax.hist(PARAMS, label="$X^{2}")
ax.hist(PARAMS, label="X", bins=BINS)
plt.title(r"Histogram of $\beta^{2}$")
plt.show()

## plot all of the data 
PARAMS = np.array(PARAMS, dtype=np.float128)
hist, bins_edges = np.histogram(PARAMS, bins=BINS)

def calculate_bins(edges): 
    """
    @edges the edges 
    """
    bins_x_values = [] 
    for i in range(len(edges) - 1): 
        bins_x_values.append((edges[i] + edges[i + 1]) / 2)
    bins_x_values = np.array(bins_x_values, dtype=np.float128)
    assert bins_x_values.size == edges.size - 1
    return bins_x_values

print(calculate_bins(bins_edges))
plt.plot(calculate_bins(bins_edges), hist)

# run curve fitting
from scipy.optimize import curve_fit 

def gauss(x, H, A, x0, sigma):
    return H + A * np.exp(-(x - x0) ** 2 / (2 * sigma ** 2))

x_values = calculate_bins(bins_edges) # the sample beta values
popt, pcov = curve_fit(gauss, x_values, hist.astype(np.float128))

# plot gaussian function
gauss_x_values = np.linspace(np.min(x_values), np.max(x_values), num=10)
gauss_y_values = np.vectorize(lambda x : gauss(x, popt[0], popt[1], popt[2], popt[3]))(x_values)

plt.plot(x_values, gauss_y_values, label="Gaussian-Smooth-Function")
plt.plot(x_values, hist, label="Raw-Frequencies")
plt.legend()
plt.show()
# %%
"""
- plan what to do during summer break
- have to do all of the progress checks!!
"""