import { useEffect, useState } from "react";
import {Form,FormControl} from 'react-bootstrap';
import {Row, Col} from 'react-bootstrap';
import {Button} from 'react-bootstrap';
import DbContent from "./DbContent";

const NodeDb = () => {

    const [theUrl, setUrl] = useState(null);
    const [newUrl, setNewUrl] = useState(false);
    const [theContent, setContent] = useState({});
    const [theError, setError] = useState(null);
    const [getData, setGetData] = useState(false);

    const {error, data: content} = DbContent("localhost:5000");

    useEffect(() => {
      console.log("useEffect newUrl= "+newUrl);
      fetch(theUrl)
      .then(res => {
        if (!res.ok) { // error coming back from server
          throw Error('could not fetch the data for that resource');
        }
        console.log(res);
        return res.json();
      })
      .then(data => {
        setContent(JSON.stringify(data));
        setNewUrl(false);
        setError(null);
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          console.log('fetch aborted')
        } else {
          // auto catches network / connection error
          setError(err.message);
          setNewUrl(false);
        }
      })
    // abort the fetch
    }, [newUrl])

    return(
        <>
        <hr />
        <Form>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm="2">URL</Form.Label>
            <Col sm="6">
              <Form.Control id="nodedbUrl" value={theUrl} onChange={handleUrlChange}/>
            </Col>
            <Button variant="primary" onClick={getNodeData}>Get</Button> 
          </Form.Group>
          <Form.Group as={Row} className="mb-3">
            <Form.Label>DB Returned</Form.Label>
            <Form.Control as="textarea" rows={5} value={theContent}/>
            {theError && <Form.Control as="textarea" value={theError}/>}
          </Form.Group>
        </Form>
        </>
   );

   function handleUrlChange(e) {
    e.preventDefault();
    setUrl(e.target.value);
   };

   function getNodeData(e) {
    e.preventDefault();
    setNewUrl(true);
    setContent("Loading...");
   };

   function getContent() {
    //setContent("here is some content: ");
   };

}

export default NodeDb;
