import { useParams } from "react-router-dom";

export function Poll() {
    let { token } = useParams()

  return (
    <div>
        THIS IS A POLL for {token}
    </div>
  );
}

export default Poll;