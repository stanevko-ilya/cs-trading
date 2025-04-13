const request = async (options) => {
    const {
        uri = '',
        method = 'GET',
        headers = {},
        body = null,
        json = false,
        resolveWithFullResponse = false,
        simple = false,
        gzip = true,
        timeout = 0,
        followAllRedirects = false,
        pool = {},
        jar = false,
        form = false,
        multipart = false,
        qs = {},
        qsStringifyOptions = {},
        agent = false,
        compress = true,
        strictSSL = true,
        rejectUnauthorized = true,
        forever = false,
        encoding = 'utf8',
        transform = null,
        callback = null
    } = options;
  
    // Преобразуем параметры в формат fetch
    const fetchOptions = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
        credentials: jar ? 'include' : 'same-origin',
        signal: timeout > 0 ? (new AbortController().signal) : undefined
    };
  
    if (multipart) {
        fetchOptions.body = new FormData();
        Object.entries(body).forEach(([key, value]) => {
            fetchOptions.body.append(key, value);
        });
    }
  
    try {
        const response = await fetch(uri, fetchOptions);
      
        // Обработка ответа
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
  
        let data;
        if (json) {
            data = await response.json();
        } else if (form) {
            data = await response.text();
        } else {
            data = response.body;
        }
  
      if (resolveWithFullResponse) {
            return {
                statusCode: response.status,
                headers: response.headers,
                body: data
            };
      }
  
        return data;
    } catch (error) {
        console.error('Request error:', error.message);
    }
};

request(%options%).then(response => console.log(response));