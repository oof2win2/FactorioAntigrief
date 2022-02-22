import { createConnection, Connection } from "typeorm"
import FAGCBan from "./database/FAGCBan"

const run = async () => {
	const connection = await createConnection({
		type: "better-sqlite3",
		database: ":memory:",
		synchronize: true,
		entities: [FAGCBan],
		logging: true,
	})
	connection.getRepository(FAGCBan).createQueryBuilder().delete().execute()
}
run()
