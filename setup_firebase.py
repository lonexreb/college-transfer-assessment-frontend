
import os
import json

# Run this once to set up Firebase credentials
def setup_firebase_credentials():
    # Get the service account JSON from environment
    service_account_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
    
    if service_account_json:
        # Write to a file that Firebase Admin SDK can use
        with open('service-account-key.json', 'w') as f:
            f.write(service_account_json)
        
        # Set the environment variable
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'service-account-key.json'
        print("Firebase credentials configured successfully")
    else:
        print("Please add GOOGLE_APPLICATION_CREDENTIALS_JSON to your Replit Secrets")

if __name__ == "__main__":
    setup_firebase_credentials()
