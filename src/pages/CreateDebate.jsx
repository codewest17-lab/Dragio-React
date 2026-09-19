import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useCategories } from "../hooks/useCategories";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

export default function CreateDebate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const replyToCommentId = searchParams.get("replyTo");

  const { categories } = useCategories();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [options, setOptions] = useState(["Yes", "No"]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [replyContext, setReplyContext] = useState(null);
  const [collaborator, setCollaborator] = useState(null);
  const [collabQuery, setCollabQuery] = useState("");
  const [collabResults, setCollabResults] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!replyToCommentId) return;
    supabase
      .from("comments")
      .select("id, content, debate_id, profiles:author_id ( username ), debates:debate_id ( title )")
      .eq("id", replyToCommentId)
      .single()
      .then(({ data }) => { if (data) setReplyContext(data); });
  }, [replyToCommentId]);

  useEffect(() => {
    if (!collabQuery.trim() || !user) { setCollabResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id, username").ilike("username", `%${collabQuery.trim()}%`).neq("id", user.id).limit(6);
      setCollabResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [collabQuery, user]);

  function updateOption(index, value) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index) {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!categoryId) return setError("Pick a category.");
    if (cleanOptions.length < MIN_OPTIONS) return setError("Add at least two options.");
    if (new Set(cleanOptions.map((o) => o.toLowerCase())).size !== cleanOptions.length) {
      return setError("Options need to be different from each other.");
    }

    setSubmitting(true);

    let imageUrl = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("debate-images").upload(path, imageFile);
      if (uploadError) {
        setSubmitting(false);
        return setError("Couldn't upload that image. You can publish without one and add it later.");
      }
      imageUrl = supabase.storage.from("debate-images").getPublicUrl(path).data.publicUrl;
    }

    const { data, error: insertError } = await supabase
      .from("debates")
      .insert({
        author_id: user.id,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        option_a_label: cleanOptions[0],
        option_b_label: cleanOptions[1],
        image_url: imageUrl,
        in_response_to_comment_id: replyToCommentId || null,
      })
      .select("id")
      .single();

    if (insertError) {
      setSubmitting(false);
      return setError(insertError.message.includes("Rate limit") ? "You've hit the hourly limit for new debates — try again a bit later." : `Couldn't publish: ${insertError.message}`);
    }

    const { error: optionsError } = await supabase.from("debate_options").insert(
      cleanOptions.map((label, position) => ({ debate_id: data.id, label, position }))
    );

    setSubmitting(false);

    if (optionsError) {
      return setError("Debate created, but options failed to save. Please delete it and try again.");
    }

    if (collaborator) {
      await supabase.from("debate_collab_invites").insert({ debate_id: data.id, inviter_id: user.id, invitee_id: collaborator.id });
    }

    navigate(`/debate/${data.id}`);
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <header className="row" style={{ margin: "20px 0" }}>
        <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <h2 style={{ fontSize: 20 }}>Create a Debate</h2>
      </header>

      {replyContext && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="muted" style={{ fontSize: 12 }}>Replying with a debate to</p>
          <p style={{ fontSize: 14, marginTop: 4 }}>
            <strong>@{replyContext.profiles?.username || "someone"}</strong> on "{replyContext.debates?.title}"
          </p>
          <p className="muted" style={{ fontSize: 13, marginTop: 6, fontStyle: "italic" }}>"{replyContext.content}"</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="stack">
        {error && <div className="form-error-banner visible">{error}</div>}

        <div className="field">
          <label>Title</label>
          <input type="text" required minLength={5} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Is remote work better than office work?" />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea rows={4} required minLength={10} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Give context — what's the debate really about?" />
          <div className="char-count">{description.length}/2000</div>
        </div>

        <div className="field">
          <label>Category</label>
          <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="" disabled>Choose a category</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Debate Options</label>
          <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            Defaults to Yes/No — edit them, or add more for a multi-choice debate.
          </p>
          {options.map((opt, i) => (
            <div key={i} className="option-row">
              <input type="text" required maxLength={60} value={opt} placeholder="Option" onChange={(e) => updateOption(i, e.target.value)} />
              <button type="button" className="remove-option-btn" disabled={options.length <= MIN_OPTIONS} onClick={() => removeOption(i)}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
          ))}
          {options.length < MAX_OPTIONS && (
            <button type="button" className="add-option-btn" onClick={addOption}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span>Add Option
            </button>
          )}
        </div>

        <div className="field">
          <label>Image (optional)</label>
          <div className={`image-drop ${imagePreview ? "has-image" : ""}`} onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="Selected preview" />
            ) : (
              <>
                <span className="material-symbols-rounded" style={{ fontSize: 28 }}>add_photo_alternate</span>
                <p>Tap to add an image</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleImageChange} />
        </div>

        <div className="field">
          <label>Invite a co-debator (optional)</label>
          {collaborator ? (
            <div className="row">
              <span className="category-tag">@{collaborator.username}</span>
              <button type="button" className="btn-text" onClick={() => setCollaborator(null)}>Remove</button>
            </div>
          ) : (
            <>
              <input type="text" placeholder="Search a username to champion your second option" value={collabQuery} onChange={(e) => setCollabQuery(e.target.value)} />
              {collabResults.map((p) => (
                <div key={p.id} className="collab-result-row" onClick={() => { setCollaborator(p); setCollabQuery(""); setCollabResults([]); }}>
                  <span className="username">{p.username}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Publishing…" : "Publish"}</button>
      </form>
    </div>
  );
}
