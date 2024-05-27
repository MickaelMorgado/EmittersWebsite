import axios, {isCancel, AxiosError} from 'axios';

const Test = () => {

    const API_KEY = '12345678900987654321-abc34135acde13f13530';
    const BASE_URL = 'https://api-fxpractice.oanda.com/v3';

    const symbol = 'EUR_USD';
    const granularity = 'M1';

    const getHistoricalData = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/instruments/${symbol}/candles`, {
                params: {
                    granularity: granularity,
                    count: 100
                },
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                }
            });
            console.log('res')
            console.log(response.data);
        } catch (error) {
            console.log('er')
            console.error(error);
        }
    };

    getHistoricalData();

    return (
        <></>
    );
}

export default Test;