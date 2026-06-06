import Docker from "dockerode";

let docker: Docker | null = null;

export function getDocker() {
  if (!docker) {
    docker = new Docker();
  }
  return docker;
}
