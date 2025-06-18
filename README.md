
# README

<div align=center>
  <img src="./public/img/Lemon_logo.png" width="400">
</div>

Lemon provides macOS and Windows desktop applications, available for download on our official website: [www.lemonai.cc](https://www.lemonai.cc).

<p align="center">
  <a href="https://lemon-11.gitbook.io/lemonai">Get to know Lemon AI quickly</a> ·
  <a href="https://lemon-11.gitbook.io/lemonai/development-deployment-guidelines/docker-quick-deployment">Docker Quick Deployment</a> ·
  <a href="https://lemon-11.gitbook.io/lemonai/">Documentation</a> ·
</p>

<p align="center">
  <a href="./README.md"><img alt="README in English" src="https://img.shields.io/badge/English-d9d9d9"></a>
  <a href="./README_CN.md"><img alt="简体中文版自述文件" src="https://img.shields.io/badge/简体中文-d9d9d9"></a>
</p>

Lemon is an open-source General AI Agent capable of automating the entire process from requirement planning to result delivery. It can independently think and systematically plan, flexibly invoking various tools in a virtual environment, such as writing and executing code, intelligently browsing the web, operating web applications, and executing commands. Lemon excels at systematically breaking down complex tasks and executing them in an orderly manner, automatically analyzing tasks, prioritizing steps, dynamically adjusting plans, and tracking progress in real time. Its goal is to help users efficiently complete all kinds of tasks.

<figure><img src="./public/img/example.png" alt=""><figcaption></figcaption></figure>

### function and characteristic

#### Complex Task Solving
Lemon is capable of solving a wide range of complex and dynamic tasks, including but not limited to market research, document processing, travel planning, and data analysis. Through independent thinking and systematic planning, it can flexibly utilize various tools in the virtual environment—such as writing and executing code, intelligently browsing web pages, and operating web applications.

#### Autonomy and Goal Orientation
Lemon possesses a high degree of autonomy and can complete tasks independently without human intervention. It is able to perceive, reason, make decisions, and act based on predefined objectives.

#### Real-Time Task Monitoring
Users can monitor the execution status of tasks in real time through the page sidebar.

#### Multi-Scenario Coverage
Lemon is designed to handle complex tasks across multiple domains, including market research, financial analysis, data analysis, code programming, life planning, and more.

#### Self-Subscription Mode
In addition to the default model, Lemon supports user-defined model integration and online model access. These models can be used by configuring the model API.

### Using Lemon

* Quickly get Lemon running in your environment with this starter guide. Use our [documentation](https://document.lemonai.cc/) for further references and more in-depth instructions.

### System Requirements[​](https://docs.all-hands.dev/modules/usage/installation#system-requirements) <a href="#system-requirements" id="system-requirements"></a>

* MacOS with [Docker Desktop support](https://docs.docker.com/desktop/setup/install/mac-install/#system-requirements)
* Linux
* Windows with [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and [Docker Desktop support](https://docs.docker.com/desktop/setup/install/windows-install/#system-requirements)

A system with a modern processor and a minimum of **4GB RAM** is recommended to run Lemon.

### Prerequisites <a href="#prerequisites" id="prerequisites"></a>

#### MacOS

**Docker Desktop**

1. [Install Docker Desktop on Mac](https://docs.docker.com/desktop/setup/install/mac-install).
2. Open Docker Desktop, go to `Settings > Advanced` and ensure `Allow the default Docker socket to be used` is enabled.

#### Linux

Tested with Ubuntu 22.04.

**Docker Desktop**

1. [Install Docker Desktop on Linux](https://docs.docker.com/desktop/setup/install/linux/).

#### Windows

**WSL**

1. [Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install).
2. Run `wsl --version` in powershell and confirm `Default Version: 2`.

**Docker Desktop**

1. [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install).
2. Open Docker Desktop, go to `Settings` and confirm the following:

* General: `Use the WSL 2 based engine` is enabled.
* Resources > WSL Integration: `Enable integration with my default WSL distro` is enabled.

**note**

The docker command below to start the app must be run inside the WSL terminal.

### Start the App <a href="#start-the-app" id="start-the-app"></a>

The easiest way to run Lemon is in Docker.

```bash
docker pull hexdolemonai/lemon-runtime-sandbox:latest

docker run -it --rm --pull=always \
  --name lemon-app \
  --env DOCKER_HOST_ADDR=host.docker.internal \
  --env ACTUAL_HOST_WORKSPACE_PATH=${WORKSPACE_BASE:-$PWD/workspace} \
  --publish 5005:5005 \
  --add-host host.docker.internal:host-gateway \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume ~/.cache:/.cache \
  --volume ${WORKSPACE_BASE:-$PWD/workspace}:/workspace \
  --volume ${WORKSPACE_BASE:-$PWD/data}:/app/data \
  --interactive \
  --tty \
  hexdolemonai/lemon:latest make run
```

#### Contributing

For those who'd like to contribute code, see our [Contribution Guide](https://github.com/hexdocom/lemon/blob/main/CONTRIBUTING.md). At the same time, please consider supporting Lemon by sharing it on social media and at events and conferences.

### Community & contact

We welcome your contribution to lemon to help improve lemon. Include: submit code, questions, new ideas, or share interesting and useful AI applications you have created based on lemon. We also welcome you to share lemon at different events, conferences and social media.

* [GitHub Issues](https://github.com/hexdocom/Lemon/issues).Best for: bugs you encounter using Lemon.AI, and feature proposals. See our [Contribution Guide](https://github.com/hexdocom/lemon/blob/main/CONTRIBUTING.md).
* [X(Twitter)](https://x.com/LemonAI_cc). Best for: sharing your applications and hanging out with the community.
* \[commercial license]（[service@hexdo.com](mailto:service@hexdo.com)）. Business consulting on commercial use licensing lemon.

### Security disclosure

To protect your privacy, please avoid posting security issues on GitHub. Instead, send your questions to [service@hexdo.com](mailto:service@hexdo.com) and we will provide you with a more detailed answer.

### License

This repository is available under the [Lemon Open Source License](https://github.com/hexdocom/lemon/blob/main/LICENSE), which is essentially Apache 2.0 with a few additional restrictions.
