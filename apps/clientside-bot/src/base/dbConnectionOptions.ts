import { ConnectionOptionsReader } from "typeorm"

const reader = new ConnectionOptionsReader({
	root: `${__dirname}/../../`,
})

export default () => reader.get("default")
