# Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the example file and add your Azure credentials:
```bash
copy .env.example .env
```

Edit `.env` with your actual values:
```
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-secret-here
AZURE_KEYVAULT_URL=https://your-keyvault-name.vault.azure.net
```

### 3. Run the Program

**Development mode (TypeScript):**
```bash
npm run dev
```

**Production mode (JavaScript):**
```bash
npm run build
npm start
```

## 📋 What's Included

- ✅ **package.json** - Dependencies and scripts
- ✅ **tsconfig.json** - TypeScript configuration
- ✅ **src/index.ts** - Main program with full authentication flow
- ✅ **README.md** - Complete documentation
- ✅ **.env.example** - Environment variable template
- ✅ **.gitignore** - Security best practices

## 🔑 Key Features

1. **ClientSecretCredential** - Service Principal authentication
2. **Environment Variables** - Secure credential management with dotenv
3. **Key Vault Integration** - Real authentication verification
4. **Error Handling** - Comprehensive error messages for 401, 403, 404
5. **Async/Await** - Modern TypeScript patterns throughout
6. **Type Safety** - Full TypeScript with strict mode

## 🧪 Testing Without Azure Resources

If you don't have Azure resources set up yet, the program will:
- Validate environment variables are present
- Create the credential object
- Attempt to connect to Key Vault
- Provide clear error messages if credentials are invalid

## 📚 Next Steps

1. Create a Service Principal: `az ad sp create-for-rbac --name "MyApp"`
2. Create a Key Vault: `az keyvault create --name "my-vault" --resource-group "my-rg"`
3. Grant access: `az keyvault set-policy --name "my-vault" --spn <client-id> --secret-permissions get list`
4. Run the program!
