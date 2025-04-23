
# Blog Genie - AI-Powered Blog Post Generator

## Project info

**URL**: https://lovable.dev/projects/1d5f9cb4-a97b-4228-b535-3400ce5645e9

## Features

- AI-powered blog post generation using Google's Gemini API
- WordPress integration for automatic publishing
- Scheduled posting on specific days and times
- Dashboard with statistics
- User accounts with custom preferences
- Timezone support

## Recent Changes

- Fixed UUID validation for Supabase database integration
- Added proper timezone handling for scheduled posts
- Improved error handling for scheduling functionality
- Added validation for post topics and scheduling days
- Enhanced logging for easier debugging
- Added AWS EC2 deployment instructions

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1d5f9cb4-a97b-4228-b535-3400ce5645e9) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (for database and authentication)
- date-fns (for date handling and timezone support)

## Deploying to AWS EC2

### Prerequisites

1. An AWS account
2. Basic knowledge of AWS services
3. A domain name (optional, for HTTPS setup)

### Step 1: Create an EC2 Instance

1. Log in to your AWS Management Console
2. Navigate to EC2 Dashboard
3. Click "Launch Instance"
4. Choose an Amazon Linux or Ubuntu Server AMI
5. Select an instance type (t2.micro is included in the free tier)
6. Configure instance details (default settings work for basic setup)
7. Add storage (default 8GB is sufficient for this app)
8. Add tags (optional)
9. Configure security group:
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80)
   - Allow HTTPS (port 443)
10. Review and launch
11. Create a new key pair or use an existing one, and download the key pair

### Step 2: Connect to Your Instance

```sh
# Change permissions for your key file
chmod 400 your-key-pair.pem

# Connect to your instance
ssh -i your-key-pair.pem ec2-user@your-instance-public-dns
```

### Step 3: Install Dependencies

For Amazon Linux:
```sh
# Update the package manager
sudo yum update -y

# Install Node.js and npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.bashrc
nvm install --lts

# Install Git
sudo yum install git -y

# Install Nginx
sudo amazon-linux-extras install nginx1 -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

For Ubuntu:
```sh
# Update the package manager
sudo apt update
sudo apt upgrade -y

# Install Node.js and npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.bashrc
nvm install --lts

# Install Git
sudo apt install git -y

# Install Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 4: Clone and Build the Application

```sh
# Clone your repository
git clone https://github.com/yourusername/your-repo.git
cd your-repo

# Install dependencies
npm install

# Build the application
npm run build
```

### Step 5: Configure Nginx

```sh
# Create a new Nginx site configuration
sudo nano /etc/nginx/sites-available/blog-genie

# Add the following configuration
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # or your EC2 public IP

    root /path/to/your-repo/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/blog-genie /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: Set Up Environment Variables (Optional)

If your application uses environment variables:

```sh
# Create a .env file
nano .env.production

# Add your environment variables
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 7: Set Up SSL with Let's Encrypt (Optional)

```sh
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y  # for Ubuntu
# or
sudo amazon-linux-extras install epel -y  # for Amazon Linux
sudo yum install certbot python-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Set up auto-renewal
sudo systemctl status certbot.timer
```

### Step 8: Set Up a Process Manager (PM2)

```sh
# Install PM2 globally
npm install -g pm2

# Start your application with PM2 (if you have a server component)
pm2 start npm --name "blog-genie" -- start

# Configure PM2 to start on system boot
pm2 startup
sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v14.x.x/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save
```

### Step 9: Monitoring and Maintenance

```sh
# View logs
pm2 logs

# Monitor application
pm2 monit

# Update application
cd /path/to/your-repo
git pull
npm install
npm run build
pm2 restart blog-genie
```

## How can I deploy this project?

For quick deployments, simply open [Lovable](https://lovable.dev/projects/1d5f9cb4-a97b-4228-b535-3400ce5645e9) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
