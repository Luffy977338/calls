import useWebRTC, { LOCAL_VIDEO } from "../hooks/useWebRTC";
import { useParams } from "react-router";

function layout(clientsNumber = 1) {
  const pairs = Array.from({ length: clientsNumber }).reduce(
    (acc, next, index, arr) => {
      if (index % 2 === 0) {
        acc.push(arr.slice(index, index + 2));
      }

      return acc;
    },
    [],
  );

  const rowsNumber = pairs.length;
  const height = `${100 / rowsNumber}%`;

  return pairs
    .map((row, index, arr) => {
      if (index === arr.length - 1 && row.length === 1) {
        return [
          {
            width: "100%",
            height,
            position: "relative",
          },
        ];
      }

      return row.map(() => ({
        width: "50%",
        height,
        position: "relative",
      }));
    })
    .flat();
}

export default function Room() {
  const { id: roomID } = useParams();
  const { clients, provideMediaRef } = useWebRTC(roomID);
  const videoLayout = layout(clients.length);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {clients.map((clientID, index) => {
        return (
          <div key={clientID} style={videoLayout[index]} id={clientID}>
            <video
              width='100%'
              height='100%'
              ref={(instance) => {
                provideMediaRef(clientID, instance);
              }}
              autoPlay
              playsInline
              muted={clientID === LOCAL_VIDEO}
            />
          </div>
        );
      })}
    </div>
  );
}
