//        NodeTableBody.jsx  Renders the body of the table
//        that represents data from the node DB.
//
//        Copyright (c) 2026, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Dave Hanks, Jet Propulsion Laboratory         
//                                                               

import {Form} from 'react-bootstrap';

//
// tableData            - either unsorted or sorted data depending on what the
//                        user has clicked
// handleCheckBoxChange - called when a users clicks a box in the Select
//                        column
const NodeTableBody = ({ tableData, handleCheckboxChange }) => {
  return (
    <tbody>
        {tableData.map((item) => {
        return (
        <tr key={item.node_id}>
            <td className="d-flex justify-content-center">
            <Form.Check
                type="checkbox"
                id={'checkbox-${item.host_id}'}
                checked={item.checked}
                onChange={() => handleCheckboxChange(item.node_id)}
                />
            </td>
            <td>{item.node_id}</td>
            <td>{item.node_name}</td>
            <td>{item.prots.join(", ")}</td>
            <td>{item.node_number}</td>
            <td>{item.hostname}</td>
            <td>{item.host_id}</td>
            <td>{item.ips.join(", ")}</td>
            <td>{item.sdr_config_flags.join(", ")}</td>
        </tr>
        );
        })}
    </tbody>
  );
};

export default NodeTableBody;
