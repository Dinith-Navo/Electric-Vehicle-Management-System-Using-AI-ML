import firebase_admin

from firebase_admin import credentials, firestore

from app.config.settings import FIREBASE_CREDENTIAL_PATH


db = None


def initialize_firebase():
    global db

    if db is not None:
        return db

    if not FIREBASE_CREDENTIAL_PATH.exists():
        print("ERROR: Firebase credential file not found.")
        return None

    if not firebase_admin._apps:
        cred = credentials.Certificate(
            str(FIREBASE_CREDENTIAL_PATH)
        )

        firebase_admin.initialize_app(cred)

    db = firestore.client()

    print("Firebase connected successfully.")

    return db


def get_database():
    global db

    if db is None:
        return initialize_firebase()

    return db