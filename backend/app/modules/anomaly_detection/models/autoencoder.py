import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from typing import Tuple, Dict, List
from app.ml.feature_engineering import FEATURE_NAMES

class PyTorchAutoencoderNet(nn.Module):
    def __init__(self, input_dim: int = 7, latent_dim: int = 3):
        super().__init__()
        self.input_dim = input_dim
        if input_dim == 7:
            # 7-feature architecture matched with NEV fault dataset
            self.encoder = nn.Sequential(
                nn.Linear(7, 12),
                nn.ReLU(),
                nn.Linear(12, 6),
                nn.ReLU(),
                nn.Linear(6, latent_dim)
            )
            self.decoder = nn.Sequential(
                nn.Linear(latent_dim, 6),
                nn.ReLU(),
                nn.Linear(6, 12),
                nn.ReLU(),
                nn.Linear(12, 7)
            )
        else:
            # Standard 25-feature architecture
            self.encoder = nn.Sequential(
                nn.Linear(input_dim, 16),
                nn.ReLU(),
                nn.Linear(16, 8),
                nn.ReLU(),
                nn.Linear(8, latent_dim)
            )
            self.decoder = nn.Sequential(
                nn.Linear(latent_dim, 8),
                nn.ReLU(),
                nn.Linear(8, 16),
                nn.ReLU(),
                nn.Linear(16, input_dim)
            )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        latent = self.encoder(x)
        reconstruction = self.decoder(latent)
        return reconstruction

class AutoencoderModel:
    def __init__(self, input_dim: int = 7, latent_dim: int = 3, lr: float = 0.001):
        self.input_dim = input_dim
        self.net = PyTorchAutoencoderNet(input_dim, latent_dim)
        self.optimizer = optim.Adam(self.net.parameters(), lr=lr)
        self.criterion = nn.MSELoss()
        self.is_fitted = False
        self.threshold = 1.0  # Dynamic threshold set during training

    def set_architecture(self, input_dim: int = 7, latent_dim: int = 3):
        self.input_dim = input_dim
        self.net = PyTorchAutoencoderNet(input_dim, latent_dim)
        self.optimizer = optim.Adam(self.net.parameters(), lr=0.001)

    def fit(self, X: np.ndarray, epochs: int = 40, batch_size: int = 32):
        """Train Autoencoder on normal operational feature matrix X."""
        if X.shape[1] != self.input_dim:
            self.set_architecture(input_dim=X.shape[1])

        self.net.train()
        tensor_x = torch.tensor(X, dtype=torch.float32)
        dataset = torch.utils.data.TensorDataset(tensor_x)
        loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

        for epoch in range(epochs):
            for batch in loader:
                inputs = batch[0]
                self.optimizer.zero_grad()
                outputs = self.net(inputs)
                loss = self.criterion(outputs, inputs)
                loss.backward()
                self.optimizer.step()

        # Calculate 95th percentile reconstruction loss threshold on normal training set
        self.net.eval()
        with torch.no_grad():
            reconstructions = self.net(tensor_x)
            train_errors = torch.mean((tensor_x - reconstructions) ** 2, dim=1).numpy()
            self.threshold = float(np.percentile(train_errors, 95)) * 1.5

        self.is_fitted = True

    def predict(self, x: np.ndarray) -> Tuple[float, int, Dict[str, float]]:
        """
        Calculates reconstruction error and feature-level contribution (§24).
        Returns:
          total_mse: Overall mean squared reconstruction error
          prediction: 1 for normal, -1 for anomaly
          feature_errors: Dict mapping feature name to its individual MSE
        """
        if not self.is_fitted:
            raise RuntimeError("Autoencoder model is not trained.")

        self.net.eval()
        if x.ndim == 1:
            x_arr = x.reshape(1, -1)
        else:
            x_arr = x

        # Ensure feature vector matches network input dimensions
        if x_arr.shape[1] > self.input_dim:
            x_input = x_arr[:, :self.input_dim]
        elif x_arr.shape[1] < self.input_dim:
            pad = np.zeros((x_arr.shape[0], self.input_dim - x_arr.shape[1]), dtype=np.float32)
            x_input = np.hstack([x_arr, pad])
        else:
            x_input = x_arr

        tensor_x = torch.tensor(x_input, dtype=torch.float32)
        with torch.no_grad():
            reconstruction = self.net(tensor_x)
            sq_diff = (tensor_x - reconstruction).numpy()[0] ** 2

        total_mse = float(np.mean(sq_diff))
        pred = -1 if total_mse > self.threshold else 1

        feature_errors = {
            name: float(sq_diff[i]) for i, name in enumerate(FEATURE_NAMES) if i < len(sq_diff)
        }

        return total_mse, pred, feature_errors
