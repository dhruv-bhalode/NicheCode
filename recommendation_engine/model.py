import torch
import torch.nn as nn

class NCFModel(nn.Module):
    def __init__(self, num_users, num_items, latent_dim_gmf=32, latent_dim_mlp=32, layers=[64, 32, 16, 8]):
        super(NCFModel, self).__init__()
        
        # GMF Part
        self.embed_user_gmf = nn.Embedding(num_users, latent_dim_gmf)
        self.embed_item_gmf = nn.Embedding(num_items, latent_dim_gmf)
        
        # MLP Part
        self.embed_user_mlp = nn.Embedding(num_users, latent_dim_mlp)
        self.embed_item_mlp = nn.Embedding(num_items, latent_dim_mlp)
        
        mlp_modules = []
        input_size = latent_dim_mlp * 2
        for layer_size in layers:
            mlp_modules.append(nn.Linear(input_size, layer_size))
            mlp_modules.append(nn.ReLU())
            mlp_modules.append(nn.Dropout(p=0.2))
            input_size = layer_size
        self.mlp_layers = nn.Sequential(*mlp_modules)
        
        # Fusion Layer
        # Input size = GMF latent dim + last MLP layer size
        self.prediction_layer = nn.Linear(latent_dim_gmf + layers[-1], 1)
        self.sigmoid = nn.Sigmoid()
        
        # Initialization
        self._init_weights()

    def _init_weights(self):
        # Professional weight init for embeddings and linear layers
        nn.init.normal_(self.embed_user_gmf.weight, std=0.01)
        nn.init.normal_(self.embed_item_gmf.weight, std=0.01)
        nn.init.normal_(self.embed_user_mlp.weight, std=0.01)
        nn.init.normal_(self.embed_item_mlp.weight, std=0.01)
        
        for m in self.mlp_layers:
            if isinstance(m, nn.Linear):
                nn.init.kaiming_uniform_(m.weight)
        
        nn.init.kaiming_uniform_(self.prediction_layer.weight)

    def forward(self, user_indices, item_indices):
        # GMF Branch
        user_gmf = self.embed_user_gmf(user_indices)
        item_gmf = self.embed_item_gmf(item_indices)
        gmf_output = user_gmf * item_gmf
        
        # MLP Branch
        user_mlp = self.embed_user_mlp(user_indices)
        item_mlp = self.embed_item_mlp(item_indices)
        mlp_input = torch.cat([user_mlp, item_mlp], dim=-1)
        mlp_output = self.mlp_layers(mlp_input)
        
        # Concatenate branches
        combined = torch.cat([gmf_output, mlp_output], dim=-1)
        
        # Final Score
        prediction = self.prediction_layer(combined)
        return self.sigmoid(prediction).squeeze()
