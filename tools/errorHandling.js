// Handle creating errors
export default function sendError(res, error, message) {
    if (error instanceof Error == false) {
        if (error.status === undefined) {
            return res.status(error.code).json({
                status: "failure",
                message: error.message
            });
        } else {
            return res.status(error.code).json({
                status: error.status,
                data: {
                    message: error.message
                }
            });
        }
    } else {
        console.log(`${message} --ERROR-- ${error} -- STACK -- ${error.stack}`);
        return res.status(500).json({
            status: "failure",
            message: message
        });
    }
}