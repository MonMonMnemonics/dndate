import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

export function Poll() {
    const { token } = useParams();
    const [ searchParams, _ ] = useSearchParams();

    useEffect(() => {
        getPollData();
    }, []);

    async function getPollData() {
        const res = await fetch("/api/poll/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: token,
                ott: searchParams.get("ott") ?? ""
            })
        })

        if (res.status != 200) {
            Swal.fire({
                title: "Server Error",
                icon: "error",
                text: "sorry for the inconvenience, please let admin know."
            });
        }

        const data = await res.json();
        console.log(data);
    }

    return (
        <div>
            THIS IS A POLL for {token}
        </div>
    );
}

export default Poll;