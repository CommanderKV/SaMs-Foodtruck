//////////////////////////////
//  Remove all null values  //
//////////////////////////////
export default function removeNulls(data) {
    // Check if the data is an array
    if (Array.isArray(data)) {
        // Recursively clean each item in the array 
        // and filter out null or empty objects
		return data
			.map(removeNulls)
			.filter(item => item !== null && !(typeof item === 'object' && Object.keys(item).length === 0));
	}

    // Check if the data is an object
    if (data !== null && typeof data === 'object') {
        const cleaned = {};
        // Iterate over each key-value pair in the object
        for (const [key, value] of Object.entries(data)) {
            // Recursively clean the value
            const cleanedValue = removeNulls(value);

            // If the cleaned value is not null or an empty object, add it to the cleaned object
            if (cleanedValue !== null && !(typeof cleanedValue === 'object' && Object.keys(cleanedValue).length === 0)) {
                cleaned[key] = cleanedValue;
            }
        }

        // Return cleaned data
        return cleaned;
    }

    // Return data
    return data;
}