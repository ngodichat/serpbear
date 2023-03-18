const sleep = (ms: number) => {
    return new Promise((resolve, reject) => {
        if (ms < 0) {
            reject(new Error('Invalid sleep time'));
        } else {
            setTimeout(resolve, ms);
        }
    });
};

export default sleep;