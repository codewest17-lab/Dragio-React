import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

const PRESET_AVATARS = [
  "crimson", "solar", "ocean", "emerald", "violet", "inferno",
  "arctic", "toxic", "midnight", "rose", "amber", "cyber",
].map((name) => `/avatars/hero-${name}.png`);

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("username, bio, avatar_url").eq("id", user.id).single().then(({ data }) => {
      if (!data) return;
      setUsername(data.username);
      setBio(data.bio || "");
      setAvatar(data.avatar_url || PRESET_AVATARS[0]);
    });
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: username.trim(), bio: bio.trim(), avatar_url: avatar })
      .eq("id", user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.code === "23505" ? "That username is already taken." : updateError.message);
      return;
    }
    navigate("/profile");
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <header className="row" style={{ margin: "20px 0" }}>
        <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <h2 style={{ fontSize: 20 }}>Edit Profile</h2>
      </header>

      <form onSubmit={handleSubmit} className="stack">
        {error && <div className="form-error-banner visible">{error}</div>}

        <div className="center">
          <img className="profile-avatar" style={{ width: 84, height: 84, borderRadius: "50%", margin: "0 auto 8px" }} src={avatar} alt="" />
          <p className="muted" style={{ fontSize: 13 }}>Pick an avatar below</p>
          <div className="avatar-grid">
            {PRESET_AVATARS.map((url) => (
              <div key={url} className={`avatar-option ${url === avatar ? "selected" : ""}`} onClick={() => setAvatar(url)}>
                <img src={url} alt="" />
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Username</label>
          <input type="text" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label>Bio</label>
          <textarea rows={3} maxLength={200} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people what you're about" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving…" : "Save Changes"}</button>
      </form>
    </div>
  );
}
