import { useFollow } from "../hooks/useFollow";

export default function FollowPill({ authorId }) {
  const { isFollowing, toggle, loaded, isSelf } = useFollow(authorId);

  if (!loaded || isSelf) return null;

  return (
    <button
      className={`follow-pill ${isFollowing ? "following" : ""}`}
      style={{ marginLeft: "auto" }}
      onClick={toggle}
    >
      {isFollowing ? "Following" : "+ Follow"}
    </button>
  );
}
