import { FactorioServer } from "./types/types"

const servers: FactorioServer[] = [
	{
		name: "DEV-DUMP",
		discordname: "dev-dump",
		discordid: "723280139982471247",
		logPath: "/opt/factorio/servers/test/factorio-current.log",
		joinPath: "/opt/factorio/servers/test/script-output/ext/awflogging.out",
		rconoffset: 0,
		watch: true
	}
]
export default servers