"""ProfileGuard - working example: fake-profile risk scoring.
Trains on SYNTHETIC data (no real accounts). Replace generate_data() with
data collected via official platform APIs / OSINT exports for real use."""
import numpy as np, pandas as pd, json
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

rng = np.random.default_rng(42)
FEATURES = ["followers","following","follow_ratio","posts","account_age_days",
            "has_profile_pic","bio_length","username_digit_ratio",
            "posts_per_day","external_url","name_username_match"]

def generate_data(n=4000):
    rows = []
    for i in range(n):
        fake = rng.random() < 0.4
        # overlap: 30% of fakes are 'sophisticated' (look genuine), 8% of genuine look suspicious
        looks_fake = fake if rng.random() > (0.30 if fake else 0.08) else (not fake)
        if looks_fake:
            followers = int(rng.gamma(1.5, 40)); following = int(rng.gamma(4, 300))
            posts = int(rng.gamma(1.2, 6)); age = int(rng.gamma(1.5, 60))
            pic = rng.random() < 0.45; bio = int(rng.gamma(1.2, 20))
            digits = float(np.clip(rng.beta(3, 4), 0, 1)); ext = rng.random() < 0.55
            match = rng.random() < 0.25
        else:
            followers = int(rng.gamma(2, 180)); following = int(rng.gamma(3, 110))
            posts = int(rng.gamma(2.5, 40)); age = int(rng.gamma(3, 400))
            pic = rng.random() < 0.92; bio = int(rng.gamma(3, 25))
            digits = float(np.clip(rng.beta(1, 12), 0, 1)); ext = rng.random() < 0.15
            match = rng.random() < 0.8
        age = max(age, 1)
        rows.append([followers, following, followers/(following+1), posts, age,
                     int(pic), bio, digits, posts/age, int(ext), int(match), int(fake)])
    return pd.DataFrame(rows, columns=FEATURES+["is_fake"])

df = generate_data()
X, y = df[FEATURES], df["is_fake"]
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, stratify=y, random_state=7)
model = RandomForestClassifier(n_estimators=300, max_depth=10, random_state=7, class_weight="balanced")
model.fit(Xtr, ytr)
pred = model.predict(Xte); proba = model.predict_proba(Xte)[:,1]
print(classification_report(yte, pred, target_names=["genuine","fake"], digits=3))
print("ROC-AUC:", round(roc_auc_score(yte, proba),3))
print("Confusion matrix:", confusion_matrix(yte, pred).tolist())

def score(p):
    p = dict(p); p["follow_ratio"] = p["followers"]/(p["following"]+1)
    p["posts_per_day"] = p["posts"]/max(p["account_age_days"],1)
    s = model.predict_proba(pd.DataFrame([p])[FEATURES])[0,1]
    band = "HIGH - report" if s>=.8 else "MEDIUM - manual review" if s>=.5 else "LOW"
    return round(float(s),3), band

samples = {
 "@officer_rajesh_8841 (new, no photo, follows 2400)":
   dict(followers=12, following=2400, posts=2, account_age_days=9, has_profile_pic=0,
        bio_length=0, username_digit_ratio=0.5, external_url=1, name_username_match=0),
 "@priya.sharma (3 yrs, active, normal ratio)":
   dict(followers=640, following=410, posts=210, account_age_days=1100, has_profile_pic=1,
        bio_length=70, username_digit_ratio=0.0, external_url=0, name_username_match=1),
 "@itbp_recruit_2024 (impersonation style, 40 days)":
   dict(followers=95, following=1300, posts=14, account_age_days=40, has_profile_pic=1,
        bio_length=25, username_digit_ratio=0.2, external_url=1, name_username_match=0),
}
res = {k: score(v) for k,v in samples.items()}
for k,(s,b) in res.items(): print(f"{k:55s} score={s}  -> {b}")

imp = dict(sorted(zip(FEATURES, model.feature_importances_), key=lambda t:-t[1]))
json.dump({"importance":imp,"cm":confusion_matrix(yte,pred).tolist(),
           "auc":roc_auc_score(yte,proba),"samples":{k:list(v) for k,v in res.items()}},
          open("demo_out.json","w"))
