//        NodeTable.jsx  Displays the contents of the
//        Node DB after it has been loaded from the server
//        and preprocessed.
//
//        Copyright (c) 2026, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Dave Hanks, Jet Propulsion Laboratory         
//                                                               

import {useState} from "react";
import {Table} from 'react-bootstrap';

import NodeTableBody from "./NodeTableBody";
import NodeTableHeader from "./NodeTableHeader";

//
// columns              - defined in parent
// data                 - preprocessed node DB data
// handleCheckboxChange - event listener when the user clicks a box 
//                        in the Select column
const NodeTable = ({ columns, data, handleCheckboxChange }) => {
  const [tableData, setTableData] = useState(data);

  return (
    <>
      <Table striped border hover>
        <NodeTableHeader {...{ columns, handleSorting }} />
        <NodeTableBody {...{ tableData, handleCheckboxChange }} />
      </Table>
    </>
  );

  // Called when the user clicks on the header of a sortable column.
  function handleSorting(sortField, sortOrder) {
    if (sortField) {
      const sorted = [...tableData].sort((a, b) => {
        if (a[sortField] === null) return 1;
        if (b[sortField] === null) return -1;
        if (a[sortField] === null && b[sortField] === null) return 0;
        return (
          a[sortField].toString().localeCompare(b[sortField].toString(), "en", {
            numeric: true,
          }) * (sortOrder === "asc" ? 1 : -1)
        );
      });
      setTableData(sorted);
    }
  };
};

export default NodeTable;